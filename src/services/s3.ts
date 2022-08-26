import { PutObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import crypto from 'crypto'
import dotenv from 'dotenv'
dotenv.config()

const awsConfig = {
  bucketName: process.env.AWS_BUCKET_NAME,
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY
}

let s3: S3Client | undefined
(function setS3Client (): S3Client | undefined {
  if (!awsConfig.accessKeyId || !awsConfig.secretAccessKey) {
    return
  }

  s3 = new S3Client({
    credentials: {
      accessKeyId: awsConfig.accessKeyId,
      secretAccessKey: awsConfig.secretAccessKey
    },
    region: awsConfig.region
  })

  return s3
}())

const uniqueKey = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')

  interface Savable {
    Body: Buffer | undefined
    ContentType: string | undefined
  }

async function addNewFileToS3 (file: Savable): Promise<string> {
  if (!s3) return ''
  if (!file.Body) return ''
  const params = {
    Bucket: awsConfig.bucketName,
    Key: uniqueKey(),
    Body: file.Body,
    ContentType: file.ContentType
  }
  console.log(params)
  const command = new PutObjectCommand(params)

  const result = await s3.send(command)
  console.log('🚀 ~ file: s3.ts ~ line 38 ~ addNewFileToS3 ~ result', result)
  return params.Key
}

async function getFileFromS3 (fileKey: string): Promise<string> {
  if (!s3) return ''
  const params = {
    Bucket: awsConfig.bucketName,
    Key: fileKey
  }

  console.log('😂😅😅⭕⭕', params)

  const command = new GetObjectCommand(params)
  return await getSignedUrl(s3, command)
}

export {
  addNewFileToS3,
  getFileFromS3
}
