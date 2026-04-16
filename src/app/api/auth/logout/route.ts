import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, clearAdminCookie, clearClientCookie } from "@/lib/auth";
import { noCacheHeaders } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const adminToken = request.cookies.get("admin_session_token")?.value;
    const clientToken = request.cookies.get("client_session_token")?.value;

    // Delete session from DB
    if (adminToken) {
      const payload = await verifyToken(adminToken);
      if (payload?.sessionId) {
        await prisma.session.deleteMany({ where: { id: payload.sessionId } }).catch(() => {});
      }
    }

    if (clientToken) {
      const payload = await verifyToken(clientToken);
      if (payload?.sessionId) {
        await prisma.session.deleteMany({ where: { id: payload.sessionId } }).catch(() => {});
      }
    }

    const response = NextResponse.json(
      { success: true },
      { headers: noCacheHeaders() }
    );

    response.cookies.delete("admin_session_token");
    response.cookies.delete("client_session_token");

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    const response = NextResponse.json({ success: true }, { headers: noCacheHeaders() });
    response.cookies.delete("admin_session_token");
    response.cookies.delete("client_session_token");
    return response;
  }
}
