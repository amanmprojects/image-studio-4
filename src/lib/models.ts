export type ImageSize = "1024x1024" | "1024x1440" | "1440x1024";

export type Provider = "azure-openai" | "bedrock";

export type ImageModelConfig = {
  id: string;
  label: string;
  provider: Provider;
};

export const IMAGE_MODELS = [
  {
    id: "FLUX-1.1-pro",
    label: "FLUX 1.1 Pro",
    provider: "azure-openai",
  },
  {
    id: "amazon.titan-image-generator-v1",
    label: "Amazon Titan Image Generator v1",
    provider: "bedrock",
  },
] as const satisfies readonly ImageModelConfig[];

export type ImageModel = (typeof IMAGE_MODELS)[number]["id"];

export const IMAGE_SIZES = [
  { value: "1024x1024", label: "Square (1024×1024)" },
  { value: "1024x1440", label: "Portrait (1024×1440)" },
  { value: "1440x1024", label: "Landscape (1440×1024)" },
] as const satisfies readonly { value: ImageSize; label: string }[];

export function getModelConfig(modelId: string): ImageModelConfig | undefined {
  return IMAGE_MODELS.find((m) => m.id === modelId);
}

export function isValidModel(modelId: string): modelId is ImageModel {
  return IMAGE_MODELS.some((m) => m.id === modelId);
}

export function isValidSize(size: string): size is ImageSize {
  return IMAGE_SIZES.some((s) => s.value === size);
}
