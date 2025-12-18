import { COOKIE_NAME, getSession } from "@/lib/workos";
import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/api";

export const runtime = "nodejs";

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
