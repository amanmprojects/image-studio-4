import { createOpenAI } from "@ai-sdk/openai";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { experimental_generateImage as generateImageAI } from "ai";
import { GoogleGenAI } from "@google/genai";
import { getModelConfig, ImageModel, ImageSize } from "./models";

const openai = createOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: process.env.AZURE_OPENAI_ENDPOINT,
});

const bedrock = createAmazonBedrock({
  region: process.env.AAWWSS_BEDROCK_REGION ?? "us-east-1",
  accessKeyId: process.env.AAWWSS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AAWWSS_SECRET_ACCESS_KEY,
});

// Google GenAI client - supports API key, service account, or ADC
function createGoogleGenAIClient() {
  // Option 1: API key (simplest, for Google AI Studio)
  if (process.env.GOOGLE_API_KEY) {
    return new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
  }

  // Option 2: Service account key (for production deployments like AWS Amplify)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    const credentials = JSON.parse(
      Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, "base64").toString()
    );
    return new GoogleGenAI({
      vertexai: true,
      project: credentials.project_id,
      location: process.env.GOOGLE_CLOUD_LOCATION ?? "global",
      googleAuthOptions: { credentials },
    });
  }

  // Option 3: Application Default Credentials (for local dev with gcloud)
  return new GoogleGenAI({
    vertexai: true,
    project: process.env.GOOGLE_CLOUD_PROJECT,
    location: process.env.GOOGLE_CLOUD_LOCATION ?? "global",
  });
}

const googleGenAI = createGoogleGenAIClient();

function getImageModel(modelId: ImageModel) {
  const config = getModelConfig(modelId);
  if (!config) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  switch (config.provider) {
    case "azure-openai":
      return openai.image(modelId);
    case "bedrock":
      return bedrock.image(modelId);
    case "google-vertex":
      // Google Vertex uses a different API pattern, handled separately
      return null;
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

// Generate image using Google Vertex AI (Gemini)
async function generateWithGoogleVertex(
  prompt: string,
  size: ImageSize,
  model: ImageModel
): Promise<{ base64: string; width: number; height: number }> {
  const response = await googleGenAI.models.generateContent({
    model,
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

  // Extract image from response
  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) {
    throw new Error("No response from Google Vertex AI");
  }

  for (const part of parts) {
    if (part.inlineData?.data) {
      const [width, height] = size.split("x").map(Number);
      return {
        base64: part.inlineData.data,
        width,
        height,
      };
    }
  }

  throw new Error("No image returned from Google Vertex AI");
}

export async function generateImage(
  prompt: string,
  size: ImageSize,
  model: ImageModel
): Promise<{ base64: string; width: number; height: number }> {
  const config = getModelConfig(model);
  
  // Route to Google Vertex for google-vertex provider
  if (config?.provider === "google-vertex") {
    return generateWithGoogleVertex(prompt, size, model);
  }

  const { image } = await generateImageAI({
    model: getImageModel(model)!,
    prompt,
    size,
    n: 1,
  });

  const [width, height] = size.split("x").map(Number);

  return { base64: image.base64, width, height };
}

// Generate image variation using Google Vertex AI (Gemini)
async function generateVariationWithGoogleVertex(
  sourceImageBase64: string,
  prompt: string,
  model: ImageModel
): Promise<{ base64: string; width: number; height: number }> {
  const response = await googleGenAI.models.generateContent({
    model,
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

  // Extract image from response
  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) {
    throw new Error("No response from Google Vertex AI");
  }

  for (const part of parts) {
    if (part.inlineData?.data) {
      return {
        base64: part.inlineData.data,
        width: 1024,
        height: 1024,
      };
    }
  }

  throw new Error("No image returned from Google Vertex AI");
}

export async function generateImageVariation(
  sourceImageBase64: string,
  prompt: string,
  model: ImageModel
): Promise<{ base64: string; width: number; height: number }> {
  const config = getModelConfig(model);
  if (!config) {
    throw new Error(`Unknown model: ${model}`);
  }

  if (!config.supportsVariation) {
    throw new Error(`Model ${model} does not support image variations`);
  }

  if (config.provider !== "google-vertex") {
    throw new Error(`Only Google Vertex models support variations`);
  }

  return generateVariationWithGoogleVertex(sourceImageBase64, prompt, model);
}
