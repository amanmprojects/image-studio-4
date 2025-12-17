import { createOpenAI } from "@ai-sdk/openai";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { experimental_generateImage as generateImageAI } from "ai";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { getModelConfig, ImageModel, ImageSize } from "./models";

const openai = createOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: process.env.AZURE_OPENAI_ENDPOINT,
});

const bedrock = createAmazonBedrock({
  region: process.env.AWS_BEDROCK_REGION ?? "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Direct Bedrock client for operations not supported by AI SDK
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_BEDROCK_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

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
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

export async function generateImage(
  prompt: string,
  size: ImageSize,
  model: ImageModel
): Promise<{ base64: string; width: number; height: number }> {
  const { image } = await generateImageAI({
    model: getImageModel(model),
    prompt,
    size,
    n: 1,
  });

  const [width, height] = size.split("x").map(Number);

  return { base64: image.base64, width, height };
}

export async function generateImageVariation(
  sourceImageBase64: string,
  prompt: string,
  model: ImageModel,
  similarityStrength: number = 0.7
): Promise<{ base64: string; width: number; height: number }> {
  const config = getModelConfig(model);
  if (!config) {
    throw new Error(`Unknown model: ${model}`);
  }

  if (!config.supportsVariation) {
    throw new Error(`Model ${model} does not support image variations`);
  }

  // Use AWS SDK directly for IMAGE_VARIATION task
  const requestBody = {
    taskType: "IMAGE_VARIATION",
    imageVariationParams: {
      text: prompt,
      negativeText: "bad quality, low resolution, blurry",
      images: [sourceImageBase64],
      similarityStrength: similarityStrength,
    },
    imageGenerationConfig: {
      numberOfImages: 1,
      height: 1024,
      width: 1024,
      cfgScale: 8.0,
    },
  };

  const command = new InvokeModelCommand({
    modelId: model,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(requestBody),
  });

  const response = await bedrockClient.send(command);

  // Parse response
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));

  if (responseBody.error) {
    throw new Error(`Bedrock error: ${responseBody.error}`);
  }

  const base64Image = responseBody.images?.[0];
  if (!base64Image) {
    throw new Error("No image returned from Bedrock");
  }

  return {
    base64: base64Image,
    width: 1024,
    height: 1024,
  };
}
