import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/workos";
import { db, images } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getPresignedUrl } from "@/lib/s3";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth();
    const { id } = await params;

    // Find the image and verify ownership
    const image = await db.query.images.findFirst({
      where: and(eq(images.id, id), eq(images.userId, user.id)),
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Get presigned URL and fetch the image
    const url = await getPresignedUrl(image.s3Key);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch image from storage");
    }

    const blob = await response.blob();

    // Return the image with download headers
    return new NextResponse(blob, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="image-${id}.png"`,
      },
    });
  } catch (error) {
    console.error("Download error:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to download image" },
      { status: 500 }
    );
  }
}

