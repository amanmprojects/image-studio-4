import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/workos";
import { db, images } from "@/lib/db";
import { eq, desc, isNull, and } from "drizzle-orm";
import { getPresignedUrl, URL_EXPIRY_SECONDS } from "@/lib/s3";
import { formatImageResponse } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth();
    
    // Get folder filter from query params
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");

    // Build where clause based on folder filter
    const whereClause = folderId === "root"
      ? and(eq(images.userId, user.id), isNull(images.folderId))
      : folderId
        ? and(eq(images.userId, user.id), eq(images.folderId, folderId))
        : eq(images.userId, user.id);

    const userImages = await db.query.images.findMany({
      where: whereClause,
      orderBy: [desc(images.createdAt)],
      limit: 100,
    });

    const now = new Date();

    // Find images with expired or missing cached URLs (for full images)
    const expiredImages = userImages.filter(
      (img) => !img.cachedUrl || !img.cachedUrlExpiry || img.cachedUrlExpiry < now
    );

    // Find images with expired or missing thumbnail URLs
    const expiredThumbnails = userImages.filter(
      (img) => img.thumbnailS3Key && (!img.cachedThumbnailUrl || !img.cachedThumbnailUrlExpiry || img.cachedThumbnailUrlExpiry < now)
    );

    // Refresh expired URLs in parallel and update DB
    if (expiredImages.length > 0) {
      const urlUpdates = await Promise.all(
        expiredImages.map(async (img) => {
          const url = await getPresignedUrl(img.s3Key);
          const expiry = new Date(Date.now() + URL_EXPIRY_SECONDS * 1000);
          return { id: img.id, url, expiry };
        })
      );

      // Update all expired URLs in DB (fire and forget for speed)
      Promise.all(
        urlUpdates.map(({ id, url, expiry }) =>
          db
            .update(images)
            .set({ cachedUrl: url, cachedUrlExpiry: expiry })
            .where(eq(images.id, id))
        )
      ).catch((err) => console.error("Failed to update cached URLs:", err));

      // Merge fresh URLs into results
      const urlMap = new Map(urlUpdates.map(({ id, url }) => [id, url]));
      for (const img of userImages) {
        if (urlMap.has(img.id)) {
          img.cachedUrl = urlMap.get(img.id)!;
        }
      }
    }

    // Refresh expired thumbnail URLs
    if (expiredThumbnails.length > 0) {
      const thumbnailUpdates = await Promise.all(
        expiredThumbnails.map(async (img) => {
          const url = await getPresignedUrl(img.thumbnailS3Key!);
          const expiry = new Date(Date.now() + URL_EXPIRY_SECONDS * 1000);
          return { id: img.id, url, expiry };
        })
      );

      // Update thumbnail URLs in DB
      Promise.all(
        thumbnailUpdates.map(({ id, url, expiry }) =>
          db
            .update(images)
            .set({ cachedThumbnailUrl: url, cachedThumbnailUrlExpiry: expiry })
            .where(eq(images.id, id))
        )
      ).catch((err) => console.error("Failed to update cached thumbnail URLs:", err));

      // Merge fresh thumbnail URLs into results
      const thumbnailMap = new Map(thumbnailUpdates.map(({ id, url }) => [id, url]));
      for (const img of userImages) {
        if (thumbnailMap.has(img.id)) {
          img.cachedThumbnailUrl = thumbnailMap.get(img.id)!;
        }
      }
    }

    const imagesWithUrls = userImages.map((img) =>
      formatImageResponse(img, img.cachedUrl!, img.cachedThumbnailUrl ?? undefined)
    );

    return NextResponse.json(
      { images: imagesWithUrls },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error fetching images:", error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}
