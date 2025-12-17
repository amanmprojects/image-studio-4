import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: process.env.AZURE_OPENAI_ENDPOINT,
});

export type ImageSize = "1024x1024" | "1024x1792" | "1792x1024";

export async function generateImage(
  prompt: string,
  size: ImageSize = "1024x1024"
): Promise<{ base64: string; width: number; height: number }> {
  const response = await openai.images.generate({
    model: "FLUX-1.1-pro",
    prompt,
    n: 1,
    size,
    response_format: "b64_json",
  });

  const imageData = response.data?.[0];
  if (!imageData?.b64_json) {
    throw new Error("No image data returned from OpenAI");
  }
  const base64 = imageData.b64_json;

  const [width, height] = size.split("x").map(Number);

  return { base64, width, height };
}

