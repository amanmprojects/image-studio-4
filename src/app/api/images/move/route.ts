import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/workos";
import { db, images, folders } from "@/lib/db";
import { eq, and, inArray } from "drizzle-orm";

export const runtime = "nodejs";

const moveImagesSchema = z.object({
  imageIds: z.array(z.string().uuid()).min(1).max(100),
  folderId: z.string().uuid().nullable(), // null = move to root
});

/**
 * POST /api/images/move - Move multiple images to a folder
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth();

    const body = await request.json();
    const { imageIds, folderId } = moveImagesSchema.parse(body);

    // If folderId provided, verify it belongs to the user
    if (folderId) {
      const folder = await db.query.folders.findFirst({
        where: and(eq(folders.id, folderId), eq(folders.userId, user.id)),
      });

      if (!folder) {
        return NextResponse.json(
          { error: "Target folder not found" },
          { status: 404 }
        );
      }
    }

    // Update all images that belong to the user
    const result = await db
      .update(images)
      .set({ folderId })
      .where(
        and(
          inArray(images.id, imageIds),
          eq(images.userId, user.id)
        )
      )
      .returning({ id: images.id });

    return NextResponse.json({
      success: true,
      movedCount: result.length,
      movedIds: result.map((r) => r.id),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error moving images:", error);
    return NextResponse.json(
      { error: "Failed to move images" },
      { status: 500 }
    );
  }
}
