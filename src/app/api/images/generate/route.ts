import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/workos";
import { generateImage, ImageSize } from "@/lib/openai";
import { uploadImage, generateImageKey, getPresignedUrl } from "@/lib/s3";
import { db, images, users } from "@/lib/db";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

const generateSchema = z.object({
  prompt: z.string().min(1).max(4000),
  size: z.enum(["1024x1024", "1024x1792", "1792x1024"]).default("1024x1024"),
});

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth();

    const body = await request.json();
    const { prompt, size } = generateSchema.parse(body);

    // Ensure user exists in DB
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    if (!existingUser) {
      await db.insert(users).values({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      });
    }

    // Generate image with OpenAI
    const { base64, width, height } = await generateImage(prompt, size as ImageSize);

    // Upload to S3
    const imageBuffer = Buffer.from(base64, "base64");
    const imageId = crypto.randomUUID();
    const s3Key = generateImageKey(user.id, imageId);
    await uploadImage(s3Key, imageBuffer);

    // Save to database
    const [newImage] = await db
      .insert(images)
      .values({
        id: imageId,
        userId: user.id,
        prompt,
        s3Key,
        width,
        height,
      })
      .returning();

    // Get presigned URL for viewing
    const url = await getPresignedUrl(s3Key);

    return NextResponse.json({
      id: newImage.id,
      prompt: newImage.prompt,
      width: newImage.width,
      height: newImage.height,
      url,
      createdAt: newImage.createdAt,
    });
  } catch (error) {
    console.error("Image generation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}

