/**
 * Image Models Module
 * 
 * This module provides a unified interface for working with multiple
 * image generation models from different providers.
 * 
 * Usage:
 *   import { generateImage, IMAGE_MODELS, GENERATION_MODELS } from "@/lib/models";
 * 
 * Adding a new model:
 *   1. Create a new file in src/lib/models/ (e.g., my-model.ts)
 *   2. Implement the ImageModelHandler interface
 *   3. Import and register in registry.ts
 */

// Types
export type {
  ImageSize,
  Provider,
  GenerateResult,
  ImageModelConfig,
  ImageModelHandler,
} from "./types";

export { IMAGE_SIZES, parseSize, isValidSize } from "./types";

// Registry and generation functions
export {
  IMAGE_MODELS,
  GENERATION_MODELS,
  VARIATION_MODELS,
  getModelHandler,
  getModelConfig,
  isValidModel,
  generateImage,
  generateImageVariation,
  type ImageModel,
} from "./registry";
