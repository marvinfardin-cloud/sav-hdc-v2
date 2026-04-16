import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createClientSession, setClientCookie } from "@/lib/auth";
import { noCacheHeaders } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400, headers: noCacheHeaders() }
      );
    }

    const client = await prisma.client.findUnique({ where: { email } });
    if (!client || !client.passwordHash) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401, headers: noCacheHeaders() }
      );
    }

    const valid = await bcrypt.compare(password, client.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401, headers: noCacheHeaders() }
      );
    }

    const { jwt, expiresAt } = await createClientSession(client.id);

    const response = NextResponse.json(
      { success: true },
      { headers: noCacheHeaders() }
    );
    setClientCookie(response, jwt, expiresAt);
    return response;
  } catch (error) {
    console.error("Login client error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500, headers: noCacheHeaders() }
    );
  }
}
