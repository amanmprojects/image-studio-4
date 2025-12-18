import { NextResponse } from "next/server";
import { z } from "zod";

type APIError = {
  status: number;
  error?: { message?: string };
  message?: string;
};

/**
 * Check if an error is an API error with status code
 */
function isAPIError(error: unknown): error is APIError {
  return error !== null && typeof error === "object" && "status" in error;
}

/**
 * Handle errors from AI provider APIs (OpenAI, Azure, Bedrock, etc.)
 * Returns appropriate error responses for common error cases.
 */
function handleProviderError(error: APIError): NextResponse | null {
  const message = error.error?.message || error.message || "";

  // Content moderation rejection (400)
  if (error.status === 400) {
    if (message.toLowerCase().includes("violence")) {
      return NextResponse.json(
        { error: "Content rejected: The generated image was flagged for violence. Please try a different prompt." },
        { status: 400 }
      );
    }
    if (message.toLowerCase().includes("sexual") || message.toLowerCase().includes("nsfw")) {
      return NextResponse.json(
        { error: "Content rejected: The generated image was flagged for inappropriate content. Please try a different prompt." },
        { status: 400 }
      );
    }
    if (message.toLowerCase().includes("content")) {
      return NextResponse.json(
        { error: `Content rejected: ${message}` },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: message || "Bad request to image generation API" },
      { status: 400 }
    );
  }

  // Model not found (404)
  if (error.status === 404) {
    return NextResponse.json(
      { error: "Model not found: The selected model is not available. Please try a different model." },
      { status: 404 }
    );
  }

  // Rate limiting (429)
  if (error.status === 429) {
    return NextResponse.json(
      { error: "Rate limited: Too many requests. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  // Invalid parameters (422)
  if (error.status === 422) {
    return NextResponse.json(
      { error: `Invalid parameters: ${message}` },
      { status: 422 }
    );
  }

  // Server error (5xx)
  if (error.status >= 500) {
    return NextResponse.json(
      { error: "The image generation service is temporarily unavailable. Please try again later." },
      { status: 503 }
    );
  }

  return null;
}

/**
 * Unified error handler for image API routes.
 * Handles Zod validation errors, authentication errors, and provider API errors.
 */
export function handleImageAPIError(
  error: unknown,
  context: string = "process"
): NextResponse {
  console.error(`Image ${context} error:`, error);

  // Zod validation error
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: "Invalid request", details: error.issues },
      { status: 400 }
    );
  }

  // Authentication error
  if (error instanceof Error && error.message === "Unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // AI provider API error
  if (isAPIError(error)) {
    const response = handleProviderError(error);
    if (response) return response;
  }

  // Generic error with message
  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  // Fallback
  return NextResponse.json(
    { error: `Failed to ${context} image. Please try again.` },
    { status: 500 }
  );
}
