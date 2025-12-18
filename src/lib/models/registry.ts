/**
 * Model Registry
 * Central registry for all image generation models
 */

import type { ImageModelHandler, ImageModelConfig, ImageSize, GenerateResult } from "./types";

// Import all model handlers
// Amazon models disabled for now
// import fluxPro from "./flux-pro";
// import titanV1 from "./titan-v1";
// import novaCanvas from "./nova-canvas";
import geminiFlash from "./gemini-flash";
import geminiPro from "./gemini-pro";

/**
 * All registered model handlers
 * Note: Nano Banana (gemini-flash) is listed first to be the default
 */
const MODEL_HANDLERS: ImageModelHandler[] = [
  geminiFlash,
  geminiPro,
];

/**
 * All model configurations
 */
export const IMAGE_MODELS = MODEL_HANDLERS.map((h) => h.config);

/**
 * Model ID type (union of all model IDs)
 */
export type ImageModel = (typeof IMAGE_MODELS)[number]["id"];

/**
 * Models that support generation
 */
export const GENERATION_MODELS = IMAGE_MODELS.filter((m) => m.supportsGeneration);

/**
 * Models that support variations
 */
export const VARIATION_MODELS = IMAGE_MODELS.filter((m) => m.supportsVariation);

/**
 * Get model handler by ID
 */
export function getModelHandler(modelId: string): ImageModelHandler | undefined {
  return MODEL_HANDLERS.find((h) => h.config.id === modelId);
}

/**
 * Get model configuration by ID
 */
export function getModelConfig(modelId: string): ImageModelConfig | undefined {
  return IMAGE_MODELS.find((m) => m.id === modelId);
}

/**
 * Check if a model ID is valid
 */
export function isValidModel(modelId: string): modelId is ImageModel {
  return IMAGE_MODELS.some((m) => m.id === modelId);
}

/**
 * Generate an image using the specified model
 */
export async function generateImage(
  prompt: string,
  size: ImageSize,
  modelId: ImageModel
): Promise<GenerateResult> {
  const handler = getModelHandler(modelId);
  
  if (!handler) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  if (!handler.config.supportsGeneration) {
    throw new Error(`Model ${modelId} does not support image generation`);
  }

  return handler.generate(prompt, size);
}

/**
 * Generate an image variation using the specified model
 */
export async function generateImageVariation(
  sourceImageBase64: string,
  prompt: string,
  modelId: ImageModel
): Promise<GenerateResult> {
  const handler = getModelHandler(modelId);
  
  if (!handler) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  if (!handler.config.supportsVariation || !handler.generateVariation) {
    throw new Error(`Model ${modelId} does not support image variations`);
  }

  return handler.generateVariation(sourceImageBase64, prompt);
}
