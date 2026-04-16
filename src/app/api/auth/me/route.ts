import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, getClientSession } from "@/lib/auth";
import { noCacheHeaders } from "@/lib/utils";

export async function GET(request: NextRequest) {
  // Check for admin cookie
  const adminCookie = request.cookies.get("admin_session_token")?.value;
  const clientCookie = request.cookies.get("client_session_token")?.value;

  if (adminCookie) {
    const session = await getAdminSession();
    if (session?.user) {
      return NextResponse.json(
        {
          type: "admin",
          user: {
            id: session.user.id,
            email: session.user.email,
            nom: session.user.nom,
            role: session.user.role,
          },
        },
        { headers: noCacheHeaders() }
      );
    }
  }

  if (clientCookie) {
    const session = await getClientSession();
    if (session?.client) {
      return NextResponse.json(
        {
          type: "client",
          client: {
            id: session.client.id,
            email: session.client.email,
            nom: session.client.nom,
            prenom: session.client.prenom,
            telephone: session.client.telephone,
          },
        },
        { headers: noCacheHeaders() }
      );
    }
  }

  return NextResponse.json(
    { error: "Non authentifié" },
    { status: 401, headers: noCacheHeaders() }
  );
}
