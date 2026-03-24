import { NextRequest, NextResponse } from "next/server";
import BackblazeB2 from 'backblaze-b2';

export const dynamic = 'force-dynamic';

/**
 * Convert whatever comes from DB → real Backblaze fileKey
 * Supports BOTH:
 * 1️⃣ profile-pictures/abc.jpg               (new correct format)
 * 2️⃣ /file/profile-pictures/abc.jpg         (old format with /file/ prefix)
 * 3️⃣ https://f005.backblazeb2.com/...       (old wrong format saved earlier)
 */
function normalizeFileKey(input: string): string {
  if (!input) return input;



  // Case 1: Already correct (new uploads) - starts with folder name
  if (!input.startsWith("http") && !input.startsWith("/file/")) {
    // Decode URL-encoded characters first
    const decoded = decodeURIComponent(input);
    // Remove leading slash if present - Backblaze stores without leading slash
    const normalized = decoded.startsWith('/') ? decoded.slice(1) : decoded;

    return normalized;
  }

  // Case 2: Old format with /file/ prefix (but not full URL)
  if (input.startsWith("/file/") && !input.startsWith("http")) {
    // Remove /file/ prefix and then handle the remaining path
    const withoutFilePrefix = input.slice(6); // Remove "/file/"
    const decoded = decodeURIComponent(withoutFilePrefix);
    const normalized = decoded.startsWith('/') ? decoded.slice(1) : decoded;
    return normalized;
  }

  // Case 3: Full HTTP URL (old wrong format)
  try {
    const url = new URL(input);

    /**
     * URL format could be:
     * /file/<bucketName>/announcements%2Fimage.jpg
     * OR /file/<bucketName>/file/announcements%2Fimage.jpg (double file issue)
     */
    const parts = url.pathname.split("/");

    // Find the actual file key after the bucket name
    // Skip empty parts and "file", then find bucket name, everything after is the key
    let fileKeyStart = -1;
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === "file" && i + 1 < parts.length) {
        // Check if next part is bucket name or another "file"
        if (parts[i + 1] !== "file") {
          // This is bucket name, file key starts after it
          fileKeyStart = i + 2;
          break;
        } else {
          // Double "file" issue, skip both
          fileKeyStart = i + 3;
          break;
        }
      }
    }

    if (fileKeyStart === -1) {
      throw new Error("Could not parse URL structure");
    }

    const encodedKey = parts.slice(fileKeyStart).join("/");

    // Decode %2F → / and remove leading slash if present
    const decodedKey = decodeURIComponent(encodedKey);
    const finalKey = decodedKey.startsWith('/') ? decodedKey.slice(1) : decodedKey;
    
    return finalKey;
  } catch (err) {
    console.error("Key normalization failed:", err);
    // Remove leading slash even on error
    const fallback = input.startsWith('/') ? input.slice(1) : input;
 
    return fallback;
  }
}

export async function GET(req: NextRequest) {
  try {
    const rawKey = req.nextUrl.searchParams.get('key'); // e.g., uploads/1773489027157-Tasks_Module.mp4
    if (!rawKey) {
      return NextResponse.json({ error: 'Missing file key' }, { status: 400 });
    }

    // Normalize the file key to handle various formats
    const fileKey = normalizeFileKey(rawKey);

   

    // Initialize B2 client
    const b2 = new BackblazeB2({
      applicationKeyId:'005b53028d1c0a80000000001',
      applicationKey: 'K005SWf+JfJ6feoZyJl1YC12mgUbifM',
    });


    await b2.authorize();

 
    // Generate a temporary download authorization
    const downloadAuth = await b2.getDownloadAuthorization({
      bucketId:'fba53340a2f82d019cd00a18',
      fileNamePrefix: '', // Allow access to all files in bucket for now
      validDurationInSeconds: 4 * 60 * 60, // 4 hours
    });


    // Check different possible property names
    const authToken = (downloadAuth as any)?.data?.authorizationToken || 
                     (downloadAuth as any)?.authorizationToken ||
                     (downloadAuth as any)?.token ||
                     (downloadAuth as any)?.authToken ||
                     downloadAuth;


    if (!authToken || authToken === 'undefined') {
      console.error('No authorization token found in B2 response');
      console.error('Response data:', (downloadAuth as any)?.data);
      return NextResponse.json({ error: 'Failed to get authorization token from B2' }, { status: 500 });
    }

    // URL-encode the file path to handle special characters like [, ], spaces
    const encodedPath = encodeURIComponent(fileKey);

    const signedUrl = `https://f005.backblazeb2.com/file/Taekwondo/${encodedPath}?Authorization=${authToken}`;



    return NextResponse.json({ url: signedUrl });
  } catch (error: any) {
    console.error('Error generating signed URL:', error);
    return NextResponse.json({ error: 'Failed to generate signed URL', details: error.message }, { status: 500 });
  }
}
