import { db, images } from "@/lib/db";
import { uploadImageWithThumbnail, getPresignedUrl, URL_EXPIRY_SECONDS } from "@/lib/s3";
import type { SaveImageParams, SaveImageResult, ImageResponse } from "@/lib/types";
import type { Image } from "@/lib/db/schema";

/**
 * Save a generated image to S3 and database.
 * Handles the full flow: upload original + thumbnail to S3, generate presigned URLs, save metadata to DB.
 */
export async function saveGeneratedImage(params: SaveImageParams): Promise<SaveImageResult> {
  const { userId, prompt, base64, width, height, model, provider, folderId } = params;

  // Upload to S3 (both original and thumbnail)
  const imageBuffer = Buffer.from(base64, "base64");
  const imageId = crypto.randomUUID();
  const { imageKey, thumbnailKey } = await uploadImageWithThumbnail(userId, imageId, imageBuffer);

  // Get presigned URLs and cache expiry
  const [url, thumbnailUrl] = await Promise.all([
    getPresignedUrl(imageKey),
    getPresignedUrl(thumbnailKey),
  ]);
  const cachedUrlExpiry = new Date(Date.now() + URL_EXPIRY_SECONDS * 1000);

  // Save to database with cached URLs
  const [newImage] = await db
    .insert(images)
    .values({
      id: imageId,
      userId,
      folderId: folderId || null,
      prompt,
      s3Key: imageKey,
      thumbnailS3Key: thumbnailKey,
      width,
      height,
      model,
      provider,
      cachedUrl: url,
      cachedUrlExpiry,
      cachedThumbnailUrl: thumbnailUrl,
      cachedThumbnailUrlExpiry: cachedUrlExpiry,
    })
    .returning();

  return { image: newImage, url, thumbnailUrl };
}

/**
 * Format a database image record for API response.
 */
export function formatImageResponse(image: Image, url: string, thumbnailUrl?: string): ImageResponse {
  return {
    id: image.id,
    prompt: image.prompt,
    width: image.width,
    height: image.height,
    model: image.model,
    provider: image.provider,
    url,
    thumbnailUrl,
    folderId: image.folderId,
    createdAt: image.createdAt,
  };
}
