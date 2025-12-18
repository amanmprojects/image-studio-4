/**
 * FLUX 1.1 Pro - Azure OpenAI
 * High-quality image generation model
 */

import { experimental_generateImage as generateImageAI } from "ai";
import { getOpenAIClient } from "./providers";
import type { ImageModelHandler, ImageModelConfig, ImageSize, GenerateResult } from "./types";
import { parseSize } from "./types";

const MODEL_ID = "FLUX-1.1-pro";

export const config: ImageModelConfig = {
  id: MODEL_ID,
  label: "FLUX 1.1 Pro",
  provider: "azure-openai",
  supportsGeneration: true,
  supportsVariation: false,
};

export async function generate(prompt: string, size: ImageSize): Promise<GenerateResult> {
  const client = getOpenAIClient();
  
  const { image } = await generateImageAI({
    model: client.image(MODEL_ID),
    prompt,
    size,
    n: 1,
  });

  const { width, height } = parseSize(size);

  return {
    base64: image.base64,
    width,
    height,
  };
}

/**
 * Model handler implementing the standard interface
 */
export const handler: ImageModelHandler = {
  config,
  generate,
};

export default handler;
