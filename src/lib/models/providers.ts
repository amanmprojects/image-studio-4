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
    // Option 1: API key (simplest, for Google AI Studio)
    if (process.env.GOOGLE_API_KEY) {
      _googleClient = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
    }
    // Option 2: Service account key (for production deployments like AWS Amplify)
    else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      const credentials = JSON.parse(
        Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, "base64").toString()
      );
      _googleClient = new GoogleGenAI({
        vertexai: true,
        project: credentials.project_id,
        location: process.env.GOOGLE_CLOUD_LOCATION ?? "global",
        googleAuthOptions: { credentials },
      });
    }
    // Option 3: Application Default Credentials (for local dev with gcloud)
    else {
      _googleClient = new GoogleGenAI({
        vertexai: true,
        project: process.env.GOOGLE_CLOUD_PROJECT,
        location: process.env.GOOGLE_CLOUD_LOCATION ?? "global",
      });
    }
  }
  return _googleClient;
}
