import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/workos";
import {
  generateImageVariation,
  VARIATION_MODELS,
  getModelConfig,
  type ImageModel,
} from "@/lib/models";
import { ensureUserExists, saveGeneratedImage, formatImageResponse, handleImageAPIError } from "@/lib/api";

export const runtime = "nodejs";

const variationModelIds = VARIATION_MODELS.map((m) => m.id) as [string, ...string[]];

const editSchema = z.object({
  sourceImage: z.string().min(1), // base64 encoded image
  prompt: z.string().min(1).max(4000),
  model: z.enum(variationModelIds),
  folderId: z.string().uuid().nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth();

    const body = await request.json();
    const { sourceImage, prompt, model, folderId } = editSchema.parse(body);

    // Ensure user exists in DB
    await ensureUserExists(user);

    // Generate image variation
    const { base64, width, height } = await generateImageVariation(
      sourceImage,
      prompt,
      model as ImageModel
    );

    // Get provider from model config
    const modelConfig = getModelConfig(model);
    const provider = modelConfig?.provider ?? "google-vertex";

    // Save to S3 and database (in the selected folder if specified)
    const { image, url, thumbnailUrl } = await saveGeneratedImage({
      userId: user.id,
      prompt: `[Variation] ${prompt}`,
      base64,
      width,
      height,
      model,
      provider,
      folderId: folderId || undefined,
    });

    return NextResponse.json(formatImageResponse(image, url, thumbnailUrl));
  } catch (error) {
    return handleImageAPIError(error, "edit");
  }
}
