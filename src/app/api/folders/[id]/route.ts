import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/workos";
import { db, folders, images } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import type { FolderResponse } from "@/lib/types";
import type { Folder } from "@/lib/db/schema";

export const runtime = "nodejs";

const updateFolderSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  parentId: z.string().uuid().nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().max(50).optional(),
});

function formatFolderResponse(folder: Folder): FolderResponse {
  return {
    id: folder.id,
    name: folder.name,
    parentId: folder.parentId,
    color: folder.color || "#6366f1",
    icon: folder.icon || "folder",
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
  };
}

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/folders/[id] - Get a single folder
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await requireAuth();
    const { id } = await params;

    const folder = await db.query.folders.findFirst({
      where: and(eq(folders.id, id), eq(folders.userId, user.id)),
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    return NextResponse.json(formatFolderResponse(folder));
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error fetching folder:", error);
    return NextResponse.json(
      { error: "Failed to fetch folder" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/folders/[id] - Update a folder
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await requireAuth();
    const { id } = await params;

    const body = await request.json();
    const updates = updateFolderSchema.parse(body);

    // Verify folder belongs to user
    const existingFolder = await db.query.folders.findFirst({
      where: and(eq(folders.id, id), eq(folders.userId, user.id)),
    });

    if (!existingFolder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // If changing parentId, verify new parent exists and belongs to user
    if (updates.parentId !== undefined && updates.parentId !== null) {
      // Prevent setting parent to self
      if (updates.parentId === id) {
        return NextResponse.json(
          { error: "Cannot set folder as its own parent" },
          { status: 400 }
        );
      }

      const parentFolder = await db.query.folders.findFirst({
        where: and(eq(folders.id, updates.parentId), eq(folders.userId, user.id)),
      });

      if (!parentFolder) {
        return NextResponse.json(
          { error: "Parent folder not found" },
          { status: 404 }
        );
      }

      // Prevent circular reference (parent can't be a descendant)
      const isDescendant = await checkIsDescendant(id, updates.parentId, user.id);
      if (isDescendant) {
        return NextResponse.json(
          { error: "Cannot move folder into its own subfolder" },
          { status: 400 }
        );
      }
    }

    const [updatedFolder] = await db
      .update(folders)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(eq(folders.id, id), eq(folders.userId, user.id)))
      .returning();

    return NextResponse.json(formatFolderResponse(updatedFolder));
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

    console.error("Error updating folder:", error);
    return NextResponse.json(
      { error: "Failed to update folder" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/folders/[id] - Delete a folder (images move to parent folder)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await requireAuth();
    const { id } = await params;

    // Verify folder belongs to user
    const folder = await db.query.folders.findFirst({
      where: and(eq(folders.id, id), eq(folders.userId, user.id)),
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Move all images in this folder to the parent folder (or root if no parent)
    await db
      .update(images)
      .set({ folderId: folder.parentId })
      .where(eq(images.folderId, id));

    // Move all subfolders to the parent folder
    await db
      .update(folders)
      .set({ parentId: folder.parentId, updatedAt: new Date() })
      .where(and(eq(folders.parentId, id), eq(folders.userId, user.id)));

    // Delete the folder
    await db
      .delete(folders)
      .where(and(eq(folders.id, id), eq(folders.userId, user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error deleting folder:", error);
    return NextResponse.json(
      { error: "Failed to delete folder" },
      { status: 500 }
    );
  }
}

/**
 * Check if potentialDescendantId is a descendant of ancestorId
 * Returns true if moving ancestorId into potentialDescendantId would create a cycle
 */
async function checkIsDescendant(
  ancestorId: string,
  potentialDescendantId: string,
  userId: string
): Promise<boolean> {
  // Get all folders for the user
  const allFolders = await db.query.folders.findMany({
    where: eq(folders.userId, userId),
  });

  // Build a map for quick lookup
  const folderMap = new Map(allFolders.map((f) => [f.id, f]));

  // Walk up from potentialDescendantId to see if we hit ancestorId
  let currentId: string | null = potentialDescendantId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === ancestorId) return true;
    if (visited.has(currentId)) return false; // Circular reference protection
    visited.add(currentId);

    const current = folderMap.get(currentId);
    currentId = current?.parentId ?? null;
  }

  return false;
}
