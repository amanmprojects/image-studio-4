import { getWorkOS, COOKIE_NAME } from "@/lib/workos";
import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return new Response("No code provided", { status: 400 });
  }

  const baseUrl = getBaseUrl(request);

  try {
    const { sealedSession } = await getWorkOS().userManagement.authenticateWithCode({
      code,
      clientId: process.env.WORKOS_CLIENT_ID!,
      session: {
        sealSession: true,
        cookiePassword: process.env.WORKOS_COOKIE_PASSWORD!,
      },
    });

    const response = NextResponse.redirect(`${baseUrl}/studio`);
    
    response.cookies.set(COOKIE_NAME, sealedSession!, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Auth callback error:", error);
    return NextResponse.redirect(`${baseUrl}/`);
  }
}
