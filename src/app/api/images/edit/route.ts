import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/workos";
import { generateImageVariation } from "@/lib/ai";
import { VARIATION_MODELS, ImageModel, getModelConfig } from "@/lib/models";
import { uploadImage, generateImageKey, getPresignedUrl, URL_EXPIRY_SECONDS } from "@/lib/s3";
import { db, images, users } from "@/lib/db";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

const variationModelIds = VARIATION_MODELS.map((m) => m.id) as [string, ...string[]];

const editSchema = z.object({
  sourceImage: z.string().min(1), // base64 encoded image
  prompt: z.string().min(1).max(4000),
  model: z.enum(variationModelIds),
});

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth();

    const body = await request.json();
    const { sourceImage, prompt, model } = editSchema.parse(body);

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

    // Generate image variation
    const { base64, width, height } = await generateImageVariation(
      sourceImage,
      prompt,
      model as ImageModel
    );

    // Upload to S3
    const imageBuffer = Buffer.from(base64, "base64");
    const imageId = crypto.randomUUID();
    const s3Key = generateImageKey(user.id, imageId);
    await uploadImage(s3Key, imageBuffer);

    // Get presigned URL and cache expiry
    const url = await getPresignedUrl(s3Key);
    const cachedUrlExpiry = new Date(Date.now() + URL_EXPIRY_SECONDS * 1000);

    // Get provider from model config
    const modelConfig = getModelConfig(model);
    const provider = modelConfig?.provider ?? "google-vertex";

    // Save to database with cached URL
    const [newImage] = await db
      .insert(images)
      .values({
        id: imageId,
        userId: user.id,
        prompt: `[Variation] ${prompt}`,
        s3Key,
        width,
        height,
        model,
        provider,
        cachedUrl: url,
        cachedUrlExpiry,
      })
      .returning();

    return NextResponse.json({
      id: newImage.id,
      prompt: newImage.prompt,
      width: newImage.width,
      height: newImage.height,
      model: newImage.model,
      provider: newImage.provider,
      url,
      createdAt: newImage.createdAt,
    });
  } catch (error) {
    console.error("Image edit error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to edit image. Please try again." },
      { status: 500 }
    );
  }
}




