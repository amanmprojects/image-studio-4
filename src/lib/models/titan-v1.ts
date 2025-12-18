/**
 * Amazon Titan Image Generator v1 - AWS Bedrock
 * Amazon's foundational image generation model
 */

import { experimental_generateImage as generateImageAI } from "ai";
import { getBedrockClient } from "./providers";
import type { ImageModelHandler, ImageModelConfig, ImageSize, GenerateResult } from "./types";
import { parseSize } from "./types";

const MODEL_ID = "amazon.titan-image-generator-v1";

export const config: ImageModelConfig = {
  id: MODEL_ID,
  label: "Amazon Titan Image Generator v1",
  provider: "bedrock",
  supportsGeneration: true,
  supportsVariation: false,
};

export async function generate(prompt: string, size: ImageSize): Promise<GenerateResult> {
  const client = getBedrockClient();
  
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
