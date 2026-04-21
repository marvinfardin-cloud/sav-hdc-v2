import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { noCacheHeaders } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token et mot de passe requis" },
        { status: 400, headers: noCacheHeaders() }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères" },
        { status: 400, headers: noCacheHeaders() }
      );
    }

    const client = await prisma.client.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Lien invalide ou expiré. Veuillez refaire une demande." },
        { status: 400, headers: noCacheHeaders() }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.client.update({
      where: { id: client.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json({ success: true }, { headers: noCacheHeaders() });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500, headers: noCacheHeaders() }
    );
  }
}
