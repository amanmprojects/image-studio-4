import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/workos";
import { db, folders } from "@/lib/db";
import { eq, desc, isNull, and, sql } from "drizzle-orm";
import type { FolderResponse } from "@/lib/types";
import type { Folder } from "@/lib/db/schema";

export const runtime = "nodejs";

const createFolderSchema = z.object({
  name: z.string().min(1).max(100),
  parentId: z.string().uuid().nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().max(50).optional(),
});

/**
 * Format a folder for API response
 */
function formatFolderResponse(folder: Folder, imageCount?: number): FolderResponse {
  return {
    id: folder.id,
    name: folder.name,
    parentId: folder.parentId,
    color: folder.color || "#6366f1",
    icon: folder.icon || "folder",
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
    imageCount,
  };
}

/**
 * Build a tree structure from flat folder list
 */
function buildFolderTree(
  folders: Folder[],
  imageCounts: Map<string, number>,
  parentId: string | null = null
): FolderResponse[] {
  return folders
    .filter((f) => f.parentId === parentId)
    .map((folder) => ({
      ...formatFolderResponse(folder, imageCounts.get(folder.id) ?? 0),
      children: buildFolderTree(folders, imageCounts, folder.id),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * GET /api/folders - List all folders for the current user as a tree
 */
export async function GET() {
  try {
    const { user } = await requireAuth();

    const userFolders = await db.query.folders.findMany({
      where: eq(folders.userId, user.id),
      orderBy: [desc(folders.createdAt)],
    });

    // Get image counts per folder
    const imageCountsResult = await db.execute(sql`
      SELECT folder_id, COUNT(*) as count
      FROM images
      WHERE user_id = ${user.id} AND folder_id IS NOT NULL
      GROUP BY folder_id
    `);

    const imageCounts = new Map<string, number>();
    for (const row of imageCountsResult.rows as { folder_id: string; count: string }[]) {
      imageCounts.set(row.folder_id, parseInt(row.count, 10));
    }

    // Get count of images without a folder (root level)
    const rootCountResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM images
      WHERE user_id = ${user.id} AND folder_id IS NULL
    `);
    const rootImageCount = parseInt((rootCountResult.rows[0] as { count: string }).count, 10);

    const folderTree = buildFolderTree(userFolders, imageCounts, null);

    return NextResponse.json({
      folders: folderTree,
      rootImageCount,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error fetching folders:", error);
    return NextResponse.json(
      { error: "Failed to fetch folders" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/folders - Create a new folder
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth();

    const body = await request.json();
    const { name, parentId, color, icon } = createFolderSchema.parse(body);

    // If parentId provided, verify it belongs to the user
    if (parentId) {
      const parentFolder = await db.query.folders.findFirst({
        where: and(eq(folders.id, parentId), eq(folders.userId, user.id)),
      });

      if (!parentFolder) {
        return NextResponse.json(
          { error: "Parent folder not found" },
          { status: 404 }
        );
      }
    }

    const [newFolder] = await db
      .insert(folders)
      .values({
        userId: user.id,
        parentId: parentId || null,
        name,
        color: color || "#6366f1",
        icon: icon || "folder",
      })
      .returning();

    return NextResponse.json(formatFolderResponse(newFolder, 0), { status: 201 });
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

    console.error("Error creating folder:", error);
    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 }
    );
  }
}
