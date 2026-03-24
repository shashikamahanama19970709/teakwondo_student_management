import { NextRequest, NextResponse } from 'next/server';
import { b2Client } from '@/lib/backblaze';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Extract bucket and filename from path
    // path = ['bucket', 'filename.ext']
    if (params.path.length < 2) {
      return NextResponse.json(
        { error: 'Invalid path. Expected format: /file/{bucket}/{filename}' },
        { status: 400 }
      );
    }

    const [bucket, ...filenameParts] = params.path;
    const filename = filenameParts.join('/'); // Handle filenames with slashes if needed

   ;

    // For now, ignore the bucket from URL and use the configured bucket
    // The fixFileUrl function extracts bucket from Backblaze URLs, but we need to use our configured bucket
    const signedUrlData = await b2Client.getSignedUrl(filename, 3600); // 1 hour expiry

    // Fetch the file from Backblaze using the authorization token in the header
    const fileResponse = await fetch(signedUrlData.url, {
      headers: {
        'Authorization': signedUrlData.authToken
      }
    });
   
    
    // Log response headers for debugging
    const responseHeaders: Record<string, string> = {};
    fileResponse.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
   

    if (!fileResponse.ok) {
      console.error('Backblaze fetch failed:', {
        status: fileResponse.status,
        statusText: fileResponse.statusText,
        url: signedUrlData.url,
        responseText: await fileResponse.text()
      });
      if (fileResponse.status === 404) {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch file from Backblaze' },
        { status: fileResponse.status }
      );
    }

    // Get the file content as ArrayBuffer
    const buffer = await fileResponse.arrayBuffer();

    // Determine content type based on file extension
    const extension = filename.split('.').pop()?.toLowerCase();
    const contentTypeMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'pdf': 'application/pdf',
      'txt': 'text/plain',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'wmv': 'video/x-ms-wmv',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
    };

    const contentType = contentTypeMap[extension || ''] ||
                       fileResponse.headers.get('Content-Type') ||
                       'application/octet-stream';

    // Return the file content
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400', // Cache for 1 hour, serve stale for 1 day
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    );
  }
}