/**
 * Shared types for image generation models
 */

export type ImageSize = "1024x1024" | "1024x1440" | "1440x1024";

export type Provider = "azure-openai" | "bedrock" | "google-vertex";

/**
 * Result from image generation
 */
export type GenerateResult = {
  base64: string;
  width: number;
  height: number;
};

/**
 * Configuration for an image model
 */
export type ImageModelConfig = {
  id: string;
  label: string;
  provider: Provider;
  supportsGeneration: boolean;
  supportsVariation: boolean;
};

/**
 * Interface that all image models must implement
 */
export interface ImageModelHandler {
  /** Model configuration */
  readonly config: ImageModelConfig;

  /** Generate an image from a text prompt */
  generate(prompt: string, size: ImageSize): Promise<GenerateResult>;

  /** Generate a variation of an existing image (optional) */
  generateVariation?(
    sourceImageBase64: string,
    prompt: string
  ): Promise<GenerateResult>;
}

/**
 * Available image sizes with labels
 */
export const IMAGE_SIZES = [
  { value: "1024x1024" as const, label: "Square (1024×1024)" },
  { value: "1024x1440" as const, label: "Portrait (1024×1440)" },
  { value: "1440x1024" as const, label: "Landscape (1440×1024)" },
] as const;

/**
 * Parse size string into width and height
 */
export function parseSize(size: ImageSize): { width: number; height: number } {
  const [width, height] = size.split("x").map(Number);
  return { width, height };
}

/**
 * Type guard for valid image size
 */
export function isValidSize(size: string): size is ImageSize {
  return IMAGE_SIZES.some((s) => s.value === size);
}
