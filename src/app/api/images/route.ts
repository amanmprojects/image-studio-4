import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/workos";
import { db, images } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { getPresignedUrl } from "@/lib/s3";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { user } = await requireAuth();

    const userImages = await db.query.images.findMany({
      where: eq(images.userId, user.id),
      orderBy: [desc(images.createdAt)],
      limit: 50,
    });

    const imagesWithUrls = await Promise.all(
      userImages.map(async (img) => ({
        id: img.id,
        prompt: img.prompt,
        width: img.width,
        height: img.height,
        url: await getPresignedUrl(img.s3Key),
        createdAt: img.createdAt,
      }))
    );

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

