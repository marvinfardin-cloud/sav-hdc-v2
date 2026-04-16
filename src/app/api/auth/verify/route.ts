import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, createClientSession } from "@/lib/auth";
import { noCacheHeaders } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/login?error=invalid", request.url));
    }

    // Verify the JWT magic link token
    const payload = await verifyToken(token);
    if (!payload || payload.role !== "CLIENT") {
      return NextResponse.redirect(new URL("/login?error=invalid", request.url));
    }

    // The sessionId in magic link payload is actually the DB session token
    const magicSession = await prisma.session.findUnique({
      where: { token: payload.sessionId },
      include: { client: true },
    });

    if (!magicSession || !magicSession.client || magicSession.expiresAt < new Date()) {
      return NextResponse.redirect(new URL("/login?error=expired", request.url));
    }

    // Delete the magic link session (one-time use)
    await prisma.session.delete({ where: { id: magicSession.id } });

    // Create a proper login session
    const { jwt, expiresAt } = await createClientSession(magicSession.client.id);

    const response = NextResponse.redirect(
      new URL("/client/dashboard", request.url),
      { headers: noCacheHeaders() }
    );

    response.cookies.set("client_session_token", jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.redirect(new URL("/login?error=server", request.url));
  }
}
