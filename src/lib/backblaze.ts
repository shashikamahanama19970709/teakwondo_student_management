interface B2AuthResponse {
  accountId: string;
  authorizationToken: string;
  apiUrl: string;
  downloadUrl: string;
  recommendedPartSize: number;
}

interface B2UploadUrlResponse {
  uploadUrl: string;
  authorizationToken: string;
}

interface B2FileInfo {
  fileId: string;
  fileName: string;
  uploadTimestamp: number;
}

class BackblazeB2 {
  private authToken: string | null = null;
  private apiUrl: string | null = null;
  private downloadUrl: string | null = null;
  private accountId: string | null = null;
  private recommendedPartSize: number = 100 * 1024 * 1024; // 100MB default
  private _bucketName: string | null = null;

  private get keyId(): string {
    const keyId ='005b53028d1c0a80000000001';
    if (!keyId) {
      throw new Error('B2_KEY_ID environment variable is not set');
    }
    return keyId;
  }

  private get applicationKey(): string {
    const appKey = 'K005SWf+JfJ6feoZyJl1YC12mgUbifM';
    if (!appKey) {
      throw new Error('B2_APP_KEY environment variable is not set');
    }
    return appKey;
  }

  private get bucketId(): string {
    const bucketId = 'fba53340a2f82d019cd00a18';
    if (!bucketId) {
      throw new Error('B2_BUCKET_ID environment variable is not set');
    }
    return bucketId;
  }

  private get bucketName(): string {
    if (!this._bucketName) {
      throw new Error('Bucket name not loaded. Call authorize() first.');
    }
    return this._bucketName;
  }

  public async authorize(): Promise<void> {
    try {
      const credentials = btoa(`${this.keyId}:${this.applicationKey}`);

      const response = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
        },
      });

      if (!response.ok) {
        throw new Error(`B2 authorization failed: ${response.status} ${response.statusText}`);
      }

      const data: B2AuthResponse = await response.json();

      this.authToken = data.authorizationToken;
      this.apiUrl = data.apiUrl;
      this.downloadUrl = data.downloadUrl;
      this.accountId = data.accountId;
      this.recommendedPartSize = data.recommendedPartSize;

      // Get bucket name
      this._bucketName = await this.getBucketName();
    } catch (error) {
      console.error('B2 authorization error:', error);
      throw new Error('Failed to authorize with Backblaze B2');
    }
  }

  private async ensureAuthorized(): Promise<void> {
    if (!this.authToken || !this.apiUrl) {
      await this.authorize();
    }
  }

  private async getBucketName(): Promise<string> {
    await this.ensureAuthorized();

    const response = await fetch(`${this.apiUrl}/b2api/v2/b2_list_buckets`, {
      method: 'POST',
      headers: {
        'Authorization': this.authToken!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId: this.accountId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to list buckets: ${response.status}`);
    }

    const data = await response.json();
    const bucket = data.buckets.find((b: any) => b.bucketId === this.bucketId);
    if (!bucket) {
      throw new Error(`Bucket with ID ${this.bucketId} not found`);
    }

    return bucket.bucketName;
  }

  async uploadFile(
    fileBuffer: Buffer | Uint8Array,
    fileName: string,
    contentType: string = 'application/octet-stream'
  ): Promise<string> {
    await this.ensureAuthorized();

    const fileSize = fileBuffer.length;

    // For large files (>100MB), use large file upload
    if (fileSize > 100 * 1024 * 1024) {
      return this.uploadLargeFile(fileBuffer, fileName, contentType);
    }

    // For small files, use regular upload
    return this.uploadSmallFile(fileBuffer, fileName, contentType);
  }

  private async uploadSmallFile(
    fileBuffer: Buffer | Uint8Array,
    fileName: string,
    contentType: string
  ): Promise<string> {
    try {
      // Get upload URL
      const uploadUrlResponse = await fetch(`${this.apiUrl}/b2api/v2/b2_get_upload_url`, {
        method: 'POST',
        headers: {
          'Authorization': this.authToken!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bucketId: this.bucketId,
        }),
      });

      if (!uploadUrlResponse.ok) {
        throw new Error(`Failed to get upload URL: ${uploadUrlResponse.status}`);
      }

      const uploadData: B2UploadUrlResponse = await uploadUrlResponse.json();
      // Upload file
      const uploadResponse = await fetch(uploadData.uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': uploadData.authorizationToken,
          'Content-Type': contentType,
          'X-Bz-File-Name': encodeURIComponent(fileName),
          'X-Bz-Content-Sha1': 'do_not_verify', // Let B2 calculate SHA1
        },
        body: fileBuffer as any,
      });
      if (!uploadResponse.ok) {
        throw new Error(`File upload failed: ${uploadResponse.status}`);
      }

      const fileInfo: B2FileInfo = await uploadResponse.json();

      // Return ONLY the file key, not public URL
      return fileName;
    } catch (error) {
      console.error('Small file upload error:', error);
      throw new Error('Failed to upload file to Backblaze B2');
    }
  }

  /**
   * Get an upload URL and token suitable for direct browser uploads.
   * The client is responsible for sending the file with the correct headers.
   */
  public async getDirectUploadUrl(): Promise<B2UploadUrlResponse> {
    await this.ensureAuthorized();

    const response = await fetch(`${this.apiUrl}/b2api/v2/b2_get_upload_url`, {
      method: 'POST',
      headers: {
        'Authorization': this.authToken!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bucketId: this.bucketId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get direct upload URL: ${response.status}`);
    }

    const data: B2UploadUrlResponse = await response.json();
    return data;
  }

  private async uploadLargeFile(
    fileBuffer: Buffer | Uint8Array,
    fileName: string,
    contentType: string
  ): Promise<string> {
    try {
      // Start large file upload
      const startResponse = await fetch(`${this.apiUrl}/b2api/v2/b2_start_large_file`, {
        method: 'POST',
        headers: {
          'Authorization': this.authToken!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bucketId: this.bucketId,
          fileName: fileName,
          contentType: contentType,
        }),
      });

      if (!startResponse.ok) {
        const errorText = await startResponse.text().catch(() => '');
        console.error('b2_start_large_file failed', {
          status: startResponse.status,
          statusText: startResponse.statusText,
          body: errorText,
        });
        throw new Error(`Failed to start large file upload: ${startResponse.status}`);
      }

      const startData = await startResponse.json();
      const fileId = startData.fileId;

      // Split file into parts without duplicating the underlying buffer.
      const partSize = this.recommendedPartSize;
      const totalSize = fileBuffer.length;
      const parts: (Buffer | Uint8Array)[] = [];
      for (let i = 0; i < totalSize; i += partSize) {
        const end = Math.min(i + partSize, totalSize);
        // Buffer and Uint8Array both support subarray; this avoids extra copies.
        parts.push(fileBuffer.subarray(i, end));
      }

     

      // Upload each part
      const partHashes: string[] = [];
      for (let i = 0; i < parts.length; i++) {
        const partSha1 = await this.uploadPart(fileId, parts[i], i + 1);
        partHashes.push(partSha1);
      }

      // Finish large file upload
      const finishResponse = await fetch(`${this.apiUrl}/b2api/v2/b2_finish_large_file`, {
        method: 'POST',
        headers: {
          'Authorization': this.authToken!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: fileId,
          partSha1Array: partHashes,
        }),
      });

      if (!finishResponse.ok) {
        const errorText = await finishResponse.text().catch(() => '');
        console.error('b2_finish_large_file failed', {
          status: finishResponse.status,
          statusText: finishResponse.statusText,
          body: errorText,
        });
        throw new Error(`Failed to finish large file upload: ${finishResponse.status}`);
      }

      // Return ONLY the file key, not public URL
      return fileName;
    } catch (error) {
      console.error('Large file upload error:', error);
      throw new Error('Failed to upload large file to Backblaze B2');
    }
  }

  private async uploadPart(fileId: string, partBuffer: Buffer | Uint8Array, partNumber: number): Promise<string> {
    // Get upload part URL
    const urlResponse = await fetch(`${this.apiUrl}/b2api/v2/b2_get_upload_part_url`, {
      method: 'POST',
      headers: {
        'Authorization': this.authToken!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileId: fileId,
      }),
    });

    if (!urlResponse.ok) {
      const errorText = await urlResponse.text().catch(() => '');
      console.error('b2_get_upload_part_url failed', {
        status: urlResponse.status,
        statusText: urlResponse.statusText,
        body: errorText,
      });
      throw new Error(`Failed to get upload part URL: ${urlResponse.status}`);
    }

    const urlData = await urlResponse.json();

    // Upload part
    const uploadResponse = await fetch(urlData.uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': urlData.authorizationToken,
        'X-Bz-Part-Number': partNumber.toString(),
        'Content-Length': partBuffer.length.toString(),
        'X-Bz-Content-Sha1': 'do_not_verify',
      },
      body: partBuffer as any,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text().catch(() => '');
      console.error('b2_upload_part failed', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        partNumber,
        body: errorText,
      });
      throw new Error(`Part upload failed: ${uploadResponse.status}`);
    }

    const partData = await uploadResponse.json();

    // When using "do_not_verify", Backblaze returns contentSha1 values
    // like "unverified:<sha1>". However, b2_finish_large_file expects
    // the plain SHA1 values (without the "unverified:" prefix) in
    // partSha1Array. Normalize here so finish_large_file sees the
    // expected hashes.
    const rawSha1: string = partData.contentSha1;
    const normalizedSha1 = rawSha1.startsWith('unverified:')
      ? rawSha1.substring('unverified:'.length)
      : rawSha1;

    return normalizedSha1;
  }

  async deleteFile(fileName: string): Promise<void> {
    try {
      await this.ensureAuthorized();

      // First, get file info to get fileId
      const listResponse = await fetch(`${this.apiUrl}/b2api/v2/b2_list_file_names`, {
        method: 'POST',
        headers: {
          'Authorization': this.authToken!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bucketId: this.bucketId,
          prefix: encodeURIComponent(fileName),
          maxFileCount: 1,
        }),
      });

      if (!listResponse.ok) {
        throw new Error(`Failed to list files: ${listResponse.status}`);
      }

      const listData = await listResponse.json();
      const file = listData.files.find((f: any) => f.fileName === encodeURIComponent(fileName));

      if (!file) {
        throw new Error('File not found');
      }

      // Delete file
      const deleteResponse = await fetch(`${this.apiUrl}/b2api/v2/b2_delete_file_version`, {
        method: 'POST',
        headers: {
          'Authorization': this.authToken!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: encodeURIComponent(fileName),
          fileId: file.fileId,
        }),
      });

      if (!deleteResponse.ok) {
        throw new Error(`File deletion failed: ${deleteResponse.status}`);
      }
    } catch (error) {
      console.error('File deletion error:', error);
      throw new Error('Failed to delete file from Backblaze B2');
    }
  }

  getPublicUrl(fileName: string): string {
    // Public URL helper (for public buckets). For consistency with
    // private signed URLs, always URL-encode the file name when
    // constructing the download URL.
    const encodedName = encodeURIComponent(fileName);
    return `${this.downloadUrl}/file/${this.bucketName}/${encodedName}`;
  }

  async getSignedUrl(fileName: string, expirySeconds: number = 3600): Promise<{ url: string, authToken: string }> {
    await this.ensureAuthorized();

    // Always URL-encode the file name when constructing the download
    // URL and when requesting download authorization. Backblaze stores
    // fileName in URL-encoded form (e.g. "uploads%2Fvideo.mp4").
    const encodedName = encodeURIComponent(fileName);
    const downloadUrl = `${this.downloadUrl}/file/${this.bucketName}/${encodedName}`;

    // Get download authorization token
    const downloadAuthResponse = await fetch(`${this.apiUrl}/b2api/v2/b2_get_download_authorization`, {
      method: 'POST',
      headers: {
        'Authorization': this.authToken!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bucketId: this.bucketId,
        // Use the URL-encoded file name prefix to match how Backblaze
        // stores file names internally.
        fileNamePrefix: encodedName,
        validDurationInSeconds: expirySeconds,
      }),
    });

    if (!downloadAuthResponse.ok) {
      const errorText = await downloadAuthResponse.text();
      console.error('Download auth error:', errorText);
      throw new Error(`Failed to get download authorization: ${downloadAuthResponse.status} - ${errorText}`);
    }

    const authData = await downloadAuthResponse.json();

    return {
      url: downloadUrl,
      authToken: authData.authorizationToken
    };
  }
}

// Export singleton instance
export const b2Client = new BackblazeB2();

// Export types for use in other files
export type { B2FileInfo };
