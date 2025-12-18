/**
 * Gemini 3 Pro - Google Vertex AI
 * Advanced image generation with variation support
 */

import { getGoogleClient } from "./providers";
import type { ImageModelHandler, ImageModelConfig, ImageSize, GenerateResult } from "./types";
import { parseSize } from "./types";

const MODEL_ID = "gemini-3-pro-image-preview";

export const config: ImageModelConfig = {
  id: MODEL_ID,
  label: "Nano Banana Pro 🍌",
  provider: "google-vertex",
  supportsGeneration: true,
  supportsVariation: true,
};

/**
 * Extract image from Google GenAI response
 */
function extractImageFromResponse(
  response: Awaited<ReturnType<ReturnType<typeof getGoogleClient>["models"]["generateContent"]>>
): string {
  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) {
    throw new Error("No response from Google Vertex AI");
  }

  for (const part of parts) {
    if (part.inlineData?.data) {
      return part.inlineData.data;
    }
  }

  throw new Error("No image returned from Google Vertex AI");
}

export async function generate(prompt: string, size: ImageSize): Promise<GenerateResult> {
  const client = getGoogleClient();

  const response = await client.models.generateContent({
    model: MODEL_ID,
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    config: {
      responseModalities: ["TEXT", "IMAGE"],
      temperature: 1,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  });

  const base64 = extractImageFromResponse(response);
  const { width, height } = parseSize(size);

  return { base64, width, height };
}

export async function generateVariation(
  sourceImageBase64: string,
  prompt: string
): Promise<GenerateResult> {
  const client = getGoogleClient();

  const response = await client.models.generateContent({
    model: MODEL_ID,
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: sourceImageBase64,
            },
          },
          { text: prompt },
        ],
      },
    ],
    config: {
      responseModalities: ["TEXT", "IMAGE"],
      temperature: 1,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  });

  const base64 = extractImageFromResponse(response);

  return {
    base64,
    width: 1024,
    height: 1024,
  };
}

/**
 * Model handler implementing the standard interface
 */
export const handler: ImageModelHandler = {
  config,
  generate,
  generateVariation,
};

export default handler;
