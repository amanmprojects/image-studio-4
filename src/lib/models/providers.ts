/**
 * Provider client factories
 * Lazy-initialized clients shared across models using the same provider
 */

import { createOpenAI } from "@ai-sdk/openai";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { GoogleGenAI } from "@google/genai";

// Lazy-initialized clients
let _openaiClient: ReturnType<typeof createOpenAI> | null = null;
let _bedrockClient: ReturnType<typeof createAmazonBedrock> | null = null;
let _googleClient: GoogleGenAI | null = null;

/**
 * Get Azure OpenAI client (lazy initialized)
 */
export function getOpenAIClient() {
  if (!_openaiClient) {
    _openaiClient = createOpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      baseURL: process.env.AZURE_OPENAI_ENDPOINT,
    });
  }
  return _openaiClient;
}

/**
 * Get Amazon Bedrock client (lazy initialized)
 */
export function getBedrockClient() {
  if (!_bedrockClient) {
    _bedrockClient = createAmazonBedrock({
      region: process.env.AAWWSS_BEDROCK_REGION ?? "us-east-1",
      accessKeyId: process.env.AAWWSS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AAWWSS_SECRET_ACCESS_KEY,
    });
  }
  return _bedrockClient;
}

/**
 * Get Google GenAI client (lazy initialized)
 * Supports API key, service account, or Application Default Credentials
 */
export function getGoogleClient(): GoogleGenAI {
  if (!_googleClient) {
    // Debug: Log which credentials are available (not the values!)
    console.log("[GoogleClient] Checking credentials availability:");
    console.log("  GOOGLE_API_KEY:", !!process.env.GOOGLE_API_KEY);
    console.log("  GOOGLE_SERVICE_ACCOUNT_KEY:", !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    console.log("  GOOGLE_SERVICE_ACCOUNT_KEY length:", process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.length ?? 0);
    console.log("  GOOGLE_CLIENT_EMAIL:", !!process.env.GOOGLE_CLIENT_EMAIL);
    console.log("  GOOGLE_PRIVATE_KEY:", !!process.env.GOOGLE_PRIVATE_KEY);
    console.log("  GOOGLE_CLOUD_PROJECT:", process.env.GOOGLE_CLOUD_PROJECT ?? "(not set)");
    console.log("  GOOGLE_CLOUD_LOCATION:", process.env.GOOGLE_CLOUD_LOCATION ?? "(not set)");

    // Option 1: API key (simplest, for Google AI Studio)
    if (process.env.GOOGLE_API_KEY) {
      _googleClient = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
    }
    // Option 2: Service account key (for production deployments like AWS Amplify)
    else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      try {
        // Clean up the key string (remove whitespace/newlines if accidentally added)
        const cleanKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY.replace(/\s/g, '');
        const credentials = JSON.parse(
          Buffer.from(cleanKey, "base64").toString()
        );
        _googleClient = new GoogleGenAI({
          vertexai: true,
          project: credentials.project_id,
          location: process.env.GOOGLE_CLOUD_LOCATION ?? "global",
          googleAuthOptions: { credentials },
        });
      } catch (error) {
        console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY:", error);
        // Fallthrough to other methods
      }
    }

    // Option 3: Individual Service Account Variables (Fallback for Amplify size limits/formatting issues)
    if (!_googleClient && process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      try {
        const credentials = {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Handle escaped newlines
          project_id: process.env.GOOGLE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT
        };
        _googleClient = new GoogleGenAI({
          vertexai: true,
          project: credentials.project_id,
          location: process.env.GOOGLE_CLOUD_LOCATION ?? "global",
          googleAuthOptions: { credentials },
        });
      } catch (error) {
        console.error("Failed to initialize with individual variables:", error);
      }
    }

    // Option 4: Application Default Credentials (for local dev with gcloud)
    if (!_googleClient) {
      console.log("Initializing Google Client with Default Credentials (ADC). Note: This typically fails on Amplify/Vercel if no service account is configured.");
      _googleClient = new GoogleGenAI({
        vertexai: true,
        project: process.env.GOOGLE_CLOUD_PROJECT,
        location: process.env.GOOGLE_CLOUD_LOCATION ?? "global",
      });
    }
  }
  return _googleClient;
}
