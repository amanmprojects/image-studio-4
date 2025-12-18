import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/workos";
import {
  generateImage,
  IMAGE_MODELS,
  IMAGE_SIZES,
  getModelConfig,
  type ImageModel,
  type ImageSize,
} from "@/lib/models";
import { ensureUserExists, saveGeneratedImage, formatImageResponse, handleImageAPIError } from "@/lib/api";

export const runtime = "nodejs";

const modelIds = IMAGE_MODELS.map((m) => m.id) as [string, ...string[]];
const sizeValues = IMAGE_SIZES.map((s) => s.value) as [string, ...string[]];

const generateSchema = z.object({
  prompt: z.string().min(1).max(4000),
  size: z.enum(sizeValues).default("1024x1024"),
  model: z.enum(modelIds).default("FLUX-1.1-pro"),
  folderId: z.string().uuid().nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth();

    const body = await request.json();
    const { prompt, size, model, folderId } = generateSchema.parse(body);

    // Ensure user exists in DB
    await ensureUserExists(user);

    // Generate image with selected model
    const { base64, width, height } = await generateImage(
      prompt,
      size as ImageSize,
      model as ImageModel
    );

    // Get provider from model config
    const modelConfig = getModelConfig(model);
    const provider = modelConfig?.provider ?? "azure-openai";

    // Save to S3 and database (in the selected folder if specified)
    const { image, url, thumbnailUrl } = await saveGeneratedImage({
      userId: user.id,
      prompt,
      base64,
      width,
      height,
      model,
      provider,
      folderId: folderId || undefined,
    });

    return NextResponse.json(formatImageResponse(image, url, thumbnailUrl));
  } catch (error) {
    return handleImageAPIError(error, "generate");
  }
}
