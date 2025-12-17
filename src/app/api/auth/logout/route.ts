import { COOKIE_NAME, getSession } from "@/lib/workos";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function getBaseUrl(request: NextRequest): string {
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host") || request.nextUrl.host;
  return `${protocol}://${host}`;
}

export async function GET(request: NextRequest) {
  const { session } = await getSession();
  const baseUrl = getBaseUrl(request);

  const response = NextResponse.redirect(`${baseUrl}/`);
  response.cookies.delete(COOKIE_NAME);

  if (session) {
    try {
      const logoutUrl = await session.getLogoutUrl();
      return NextResponse.redirect(logoutUrl);
    } catch {
      return response;
    }
  }

  return response;
}
