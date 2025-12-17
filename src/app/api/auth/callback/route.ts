import { workos, COOKIE_NAME } from "@/lib/workos";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return new Response("No code provided", { status: 400 });
  }

  try {
    const { sealedSession } = await workos.userManagement.authenticateWithCode({
      code,
      clientId: process.env.WORKOS_CLIENT_ID!,
      session: {
        sealSession: true,
        cookiePassword: process.env.WORKOS_COOKIE_PASSWORD!,
      },
    });

    const url = new URL("/studio", request.url);
    const response = NextResponse.redirect(url);
    
    response.cookies.set(COOKIE_NAME, sealedSession!, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Auth callback error:", error);
    const url = new URL("/", request.url);
    return NextResponse.redirect(url);
  }
}
