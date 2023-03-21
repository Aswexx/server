import { PutObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import crypto from 'crypto'
import fs from 'fs'

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
  const command = new PutObjectCommand(params)

  await s3.send(command)
  return params.Key
}

async function getFileFromS3 (fileKey: string): Promise<string> {
  if (!s3) return ''
  const params = {
    Bucket: awsConfig.bucketName,
    Key: fileKey
  }

  const command = new GetObjectCommand(params)
  return await getSignedUrl(s3, command, { expiresIn: 60 * 60 })
}

async function saveLogToS3 (filePath: string, key: string) {
  const fileContent = fs.readFileSync(filePath)
  const params = {
    Bucket: 'posquare-log',
    Key: key,
    Body: fileContent
  }

  console.log(s3, params)

  await s3?.send(new PutObjectCommand(params))
}

export { addNewFileToS3, getFileFromS3, saveLogToS3 }
