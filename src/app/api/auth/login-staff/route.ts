import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createAdminSession } from "@/lib/auth";
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

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (!user) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401, headers: noCacheHeaders() }
      );
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401, headers: noCacheHeaders() }
      );
    }

    const { jwt, expiresAt } = await createAdminSession(user.id, user.role);

    const response = NextResponse.json(
      { success: true, user: { id: user.id, email: user.email, nom: user.nom, role: user.role } },
      { status: 200, headers: noCacheHeaders() }
    );

    response.cookies.set("admin_session_token", jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500, headers: noCacheHeaders() }
    );
  }
}
