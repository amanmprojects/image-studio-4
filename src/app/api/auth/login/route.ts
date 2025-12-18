import { getWorkOS } from "@/lib/workos";
import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request);

  const authorizationUrl = getWorkOS().userManagement.getAuthorizationUrl({
    provider: "authkit",
    redirectUri: `${baseUrl}/api/auth/callback`,
    clientId: process.env.WORKOS_CLIENT_ID!,
  });

  return NextResponse.redirect(authorizationUrl);
}
