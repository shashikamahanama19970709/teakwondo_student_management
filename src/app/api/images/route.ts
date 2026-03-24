import { NextRequest, NextResponse } from 'next/server';
import { b2Client } from '@/lib/backblaze';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const imageUrl = searchParams.get('url');
        
        if (!imageUrl) {
            return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
        }

  

        // If it's already a signed URL, use it directly
        if (imageUrl.includes('backblazeb2.com') && imageUrl.includes('Authorization=')) {
        
            
            // Extract the file path from the signed URL to generate a fresh server-side signed URL
            const bucketName =  'HelpLineAcademyDB';
            const splitStr = `/file/${bucketName}/`;
            const urlParts = imageUrl.split(splitStr);
            
            if (urlParts.length >= 2) {
                const fileName = decodeURIComponent(urlParts[1]);
           
                
                try {
                    // Generate a fresh signed URL for server-side use
                    const signedUrlData = await b2Client.getSignedUrl(fileName, 3600);
               
                    
                    // Fetch the image data from Backblaze using server-side signed URL
                    const imageResponse = await fetch(signedUrlData.url, {
                        headers: {
                            'Authorization': signedUrlData.authToken
                        }
                    });
                    
                    if (!imageResponse.ok) {
                        console.error('Failed to fetch image from Backblaze:', imageResponse.status, imageResponse.statusText);
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
                    console.error('Error fetching signed image:', error);
                    return NextResponse.json({ error: 'Failed to fetch signed image' }, { status: 500 });
                }
            } else {
                console.error('Could not extract file path from signed URL');
                return NextResponse.json({ error: 'Invalid signed URL format' }, { status: 500 });
            }
        }

        // For non-signed URLs, generate signed URL first
        const bucketName =  'HelpLineAcademyDB';
        const splitStr = `/file/${bucketName}/`;
        const urlParts = imageUrl.split(splitStr);

        if (urlParts.length < 2) {
            return NextResponse.redirect(imageUrl);
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
            return NextResponse.json({ error: 'Failed to proxy image' }, { status: 500 });
        }
    } catch (error) {
        console.error('Error proxying image URL:', error);
        return NextResponse.json({ error: 'Failed to proxy image' }, { status: 500 });
    }
}
