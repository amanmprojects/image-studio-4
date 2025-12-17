import OpenAI from "openai";

export const openai = new OpenAI({
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
  // FLUX models on Azure return b64_json by default
  const response = await openai.images.generate({
    model,
    prompt,
    n: 1,
    size,
  });

  const imageData = response.data?.[0];
  
  // Handle both b64_json and url responses
  let base64: string;
  if (imageData?.b64_json) {
    base64 = imageData.b64_json;
  } else if (imageData?.url) {
    // If we get a URL, fetch and convert to base64
    const imgResponse = await fetch(imageData.url);
    const buffer = await imgResponse.arrayBuffer();
    base64 = Buffer.from(buffer).toString("base64");
  } else {
    throw new Error("No image data returned from the model");
  }

  const [width, height] = size.split("x").map(Number);

  return { base64, width, height };
}

