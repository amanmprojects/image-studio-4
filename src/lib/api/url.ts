import { NextRequest } from "next/server";

/**
 * Get the base URL from the request, handling proxied requests correctly.
 * Works across all environments (local, staging, production).
 */
export function getBaseUrl(request: NextRequest): string {
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host") || request.nextUrl.host;
  return `${protocol}://${host}`;
}
