import { getWorkOS } from "@/lib/workos";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // Get the base URL from the request to work in any environment
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host") || request.nextUrl.host;
  const baseUrl = `${protocol}://${host}`;

  const authorizationUrl = getWorkOS().userManagement.getAuthorizationUrl({
    provider: "authkit",
    redirectUri: `${baseUrl}/api/auth/callback`,
    clientId: process.env.WORKOS_CLIENT_ID!,
  });

  return NextResponse.redirect(authorizationUrl);
}
