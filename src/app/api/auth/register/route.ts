import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createClientSession, setClientCookie } from "@/lib/auth";
import { noCacheHeaders } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const { email, password, prenom, nom, telephone } = await request.json();

    if (!email || !password || !prenom || !nom || !telephone) {
      return NextResponse.json(
        { error: "Email, mot de passe, prénom, nom et téléphone sont requis" },
        { status: 400, headers: noCacheHeaders() }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères" },
        { status: 400, headers: noCacheHeaders() }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.client.findUnique({ where: { email: normalizedEmail } });

    if (existing) {
      if (existing.passwordHash) {
        // Client already registered with a password → true duplicate
        return NextResponse.json(
          { error: "Cet email est déjà utilisé" },
          { status: 409, headers: noCacheHeaders() }
        );
      }
      // Client was pre-created by admin (no password yet) → complete registration
      const passwordHash = await bcrypt.hash(password, 12);
      const updated = await prisma.client.update({
        where: { id: existing.id },
        data: { passwordHash, nom, prenom, telephone },
      });
      const { jwt, expiresAt } = await createClientSession(updated.id);
      const response = NextResponse.json({ success: true }, { status: 200, headers: noCacheHeaders() });
      setClientCookie(response, jwt, expiresAt);
      return response;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const client = await prisma.client.create({
      data: {
        email: normalizedEmail,
        nom,
        prenom,
        telephone,
        passwordHash,
      },
    });

    const { jwt, expiresAt } = await createClientSession(client.id);

    const response = NextResponse.json(
      { success: true },
      { status: 201, headers: noCacheHeaders() }
    );
    setClientCookie(response, jwt, expiresAt);
    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500, headers: noCacheHeaders() }
    );
  }
}
