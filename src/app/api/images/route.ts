import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/workos";
import { db, images } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { getPresignedUrl, URL_EXPIRY_SECONDS } from "@/lib/s3";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { user } = await requireAuth();

    const userImages = await db.query.images.findMany({
      where: eq(images.userId, user.id),
      orderBy: [desc(images.createdAt)],
      limit: 50,
    });

    const now = new Date();

    // Find images with expired or missing cached URLs
    const expiredImages = userImages.filter(
      (img) => !img.cachedUrl || !img.cachedUrlExpiry || img.cachedUrlExpiry < now
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

    const imagesWithUrls = userImages.map((img) => ({
      id: img.id,
      prompt: img.prompt,
      width: img.width,
      height: img.height,
      model: img.model,
      provider: img.provider,
      url: img.cachedUrl!,
      createdAt: img.createdAt,
    }));

    return NextResponse.json({ images: imagesWithUrls });
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
