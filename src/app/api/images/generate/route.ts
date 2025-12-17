import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/workos";
import { generateImage } from "@/lib/ai";
import { IMAGE_MODELS, IMAGE_SIZES, ImageModel, ImageSize, getModelConfig } from "@/lib/models";
import { uploadImage, generateImageKey, getPresignedUrl, URL_EXPIRY_SECONDS } from "@/lib/s3";
import { db, images, users } from "@/lib/db";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

const modelIds = IMAGE_MODELS.map((m) => m.id) as [string, ...string[]];
const sizeValues = IMAGE_SIZES.map((s) => s.value) as [string, ...string[]];

const generateSchema = z.object({
  prompt: z.string().min(1).max(4000),
  size: z.enum(sizeValues).default("1024x1024"),
  model: z.enum(modelIds).default("FLUX-1.1-pro"),
});

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth();

    const body = await request.json();
    const { prompt, size, model } = generateSchema.parse(body);

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

    // Generate image with selected model
    const { base64, width, height } = await generateImage(prompt, size as ImageSize, model as ImageModel);

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
    const provider = modelConfig?.provider ?? "azure-openai";

    // Save to database with cached URL
    const [newImage] = await db
      .insert(images)
      .values({
        id: imageId,
        userId: user.id,
        prompt,
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

    // Handle OpenAI/Azure API errors
    if (error && typeof error === "object" && "status" in error) {
      const apiError = error as { status: number; error?: { message?: string }; message?: string };
      
      // Content moderation rejection
      if (apiError.status === 400) {
        const message = apiError.error?.message || apiError.message || "";
        if (message.toLowerCase().includes("violence")) {
          return NextResponse.json(
            { error: "Content rejected: The generated image was flagged for violence. Please try a different prompt." },
            { status: 400 }
          );
        }
        if (message.toLowerCase().includes("sexual") || message.toLowerCase().includes("nsfw")) {
          return NextResponse.json(
            { error: "Content rejected: The generated image was flagged for inappropriate content. Please try a different prompt." },
            { status: 400 }
          );
        }
        if (message.toLowerCase().includes("content")) {
          return NextResponse.json(
            { error: `Content rejected: ${message}` },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: message || "Bad request to image generation API" },
          { status: 400 }
        );
      }

      // Model not found
      if (apiError.status === 404) {
        return NextResponse.json(
          { error: "Model not found: The selected model is not available. Please try a different model." },
          { status: 404 }
        );
      }

      // Rate limiting
      if (apiError.status === 429) {
        return NextResponse.json(
          { error: "Rate limited: Too many requests. Please wait a moment and try again." },
          { status: 429 }
        );
      }

      // Invalid size or parameters
      if (apiError.status === 422) {
        const message = apiError.error?.message || apiError.message || "";
        return NextResponse.json(
          { error: `Invalid parameters: ${message}` },
          { status: 422 }
        );
      }

      // Server error
      if (apiError.status >= 500) {
        return NextResponse.json(
          { error: "The image generation service is temporarily unavailable. Please try again later." },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to generate image. Please try again." },
      { status: 500 }
    );
  }
}

