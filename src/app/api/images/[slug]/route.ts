import { NextRequest, NextResponse } from 'next/server';
import { b2Client } from '@/lib/backblaze';

export async function GET(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        // Decode the base64 encoded URL from the path
        let decodedUrl: string;
        try {
            decodedUrl = Buffer.from(params.slug, 'base64').toString('utf-8');
        } catch (error) {
            console.error('Base64 decode error:', error);
            return NextResponse.json({ error: 'Invalid base64 URL' }, { status: 400 });
        }

        if (!decodedUrl.includes('backblazeb2.com')) {
            // If it's not a backblaze URL, just redirect to it
            return NextResponse.redirect(decodedUrl);
        }

        // Extract the file name from the URL
        // e.g., https://f005.backblazeb2.com/file/HelpLine/announcements/123.jpg
        const bucketName = 'Taekwondo';
        const splitStr = `/file/${bucketName}/`;
        const urlParts = decodedUrl.split(splitStr);

        if (urlParts.length < 2) {
            return NextResponse.redirect(decodedUrl);
        }

        const fileName = decodeURIComponent(urlParts[1]);

        // Generate signed URL for private bucket access
        try {
            const signedUrlData = await b2Client.getSignedUrl(fileName, 3600); // 1 hour expiry

            // Fetch the image data from Backblaze
            const imageResponse = await fetch(signedUrlData.url, {
                headers: {
                    'Authorization': signedUrlData.authToken
                }
            });

            if (!imageResponse.ok) {
                console.error('Failed to fetch image from Backblaze:', imageResponse.status);
                
                // Try without authorization token (for public buckets)
                const publicResponse = await fetch(signedUrlData.url);
                if (publicResponse.ok) {
                    const imageBuffer = await publicResponse.arrayBuffer();
                    const contentType = publicResponse.headers.get('content-type') || 'image/jpeg';
                    
                    return new NextResponse(imageBuffer, {
                        headers: {
                            'Content-Type': contentType,
                            'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
                        },
                    });
                }
                
                return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
            }

            const imageBuffer = await imageResponse.arrayBuffer();
            const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

            // Return the image data directly
            return new NextResponse(imageBuffer, {
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
                },
            });
        } catch (error) {
            console.error('Error fetching image:', error);
            
            // Fallback to redirect
            return NextResponse.redirect(decodedUrl);
        }
    } catch (error) {
        console.error('Error proxying image URL:', error);
        return NextResponse.json({ error: 'Failed to proxy image' }, { status: 500 });
    }
}