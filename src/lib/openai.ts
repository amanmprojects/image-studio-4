import { createOpenAI } from "@ai-sdk/openai";
import { experimental_generateImage as generateImageAI } from "ai";

export const openai = createOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: process.env.AZURE_OPENAI_ENDPOINT,
});

// FLUX models max dimension is 1440px
export type ImageSize = "1024x1024" | "1024x1440" | "1440x1024";
export type ImageModel = "FLUX-1.1-pro";

export const AVAILABLE_MODELS: { value: ImageModel; label: string }[] = [
  { value: "FLUX-1.1-pro", label: "FLUX 1.1 Pro" },
];

export async function generateImage(
  prompt: string,
  size: ImageSize = "1024x1024",
  model: ImageModel = "FLUX-1.1-pro"
): Promise<{ base64: string; width: number; height: number }> {
  const { image } = await generateImageAI({
    model: openai.image(model),
    prompt,
    size,
    n: 1,
  });

  const [width, height] = size.split("x").map(Number);

  return { base64: image.base64, width, height };
}
