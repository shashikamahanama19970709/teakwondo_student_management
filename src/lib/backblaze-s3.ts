import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const REGION = 'us-east-005'

function createS3Client() {
  const endpoint = 'https://s3.us-east-005.backblazeb2.com'
  const accessKeyId = '005b53028d1c0a80000000002'
  const secretAccessKey = 'K005HNjWoMnRjDuMNo+6xaNV8KJYJiI'
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing Backblaze S3 configuration (B2_S3_ENDPOINT / B2_S3_KEY_ID / B2_S3_APPLICATION_KEY)')
  }

  const s3Client = new S3Client({
    region: REGION,
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey
    },
    forcePathStyle: true
  })
  return s3Client;
}

export async function getUploadPresignedUrl(params: {
  key: string
  contentType: string
  expiresIn?: number
}): Promise<string> {
  const bucket = 'Taekwondo'
  if (!bucket) {
    throw new Error('Missing Backblaze S3 bucket (B2_S3_BUCKET)')
  }

  const s3 = createS3Client()
 
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: params.key,
    ContentType: params.contentType || 'application/octet-stream'
  })

  const url = await getSignedUrl(s3, command, {
    expiresIn: params.expiresIn ?? 3600
  })

 

  return url
}
