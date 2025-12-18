/**
 * Amazon Nova Canvas - AWS Bedrock
 * Amazon's advanced canvas model for image generation
 */

import { experimental_generateImage as generateImageAI } from "ai";
import { getBedrockClient } from "./providers";
import type { ImageModelHandler, ImageModelConfig, ImageSize, GenerateResult } from "./types";
import { parseSize } from "./types";

const MODEL_ID = "amazon.nova-canvas-v1:0";

export const config: ImageModelConfig = {
  id: MODEL_ID,
  label: "Amazon Nova Canvas",
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
