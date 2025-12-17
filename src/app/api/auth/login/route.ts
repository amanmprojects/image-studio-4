import { workos } from "@/lib/workos";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const authorizationUrl = workos.userManagement.getAuthorizationUrl({
    provider: "authkit",
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    clientId: process.env.WORKOS_CLIENT_ID!,
  });

  return NextResponse.redirect(authorizationUrl);
}
