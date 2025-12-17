import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AAWWSS_REGION!,
  credentials: {
    accessKeyId: process.env.AAWWSS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AAWWSS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

export async function uploadImage(
  key: string,
  body: Buffer,
  contentType: string = "image/png"
): Promise<string> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return key;
}

// 23 hours - gives buffer before 24h expiry
export const URL_EXPIRY_SECONDS = 23 * 60 * 60;

export async function getPresignedUrl(
  key: string,
  expiresIn: number = URL_EXPIRY_SECONDS
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}

export function generateImageKey(userId: string, imageId: string): string {
  return `users/${userId}/${imageId}.png`;
}

