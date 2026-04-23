import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getClientSession } from "@/lib/auth";
import { noCacheHeaders } from "@/lib/utils";

export async function PATCH(request: NextRequest) {
  const session = await getClientSession();
  if (!session?.client) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401, headers: noCacheHeaders() });
  }

  try {
    const body = await request.json();
    const { action } = body;
    const clientId = session.client.id;

    if (action === "profile") {
      const { nom, prenom, telephone } = body;
      if (!nom?.trim() || !prenom?.trim()) {
        return NextResponse.json({ error: "Nom et prénom requis" }, { status: 400, headers: noCacheHeaders() });
      }
      await prisma.client.update({
        where: { id: clientId },
        data: { nom: nom.trim(), prenom: prenom.trim(), telephone: telephone?.trim() || null },
      });
      return NextResponse.json({ success: true }, { headers: noCacheHeaders() });
    }

    if (action === "password") {
      const { currentPassword, newPassword } = body;
      if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400, headers: noCacheHeaders() });
      }
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: "Le nouveau mot de passe doit contenir au moins 8 caractères" },
          { status: 400, headers: noCacheHeaders() }
        );
      }
      const client = await prisma.client.findUnique({ where: { id: clientId } });
      if (!client?.passwordHash) {
        return NextResponse.json({ error: "Aucun mot de passe défini" }, { status: 400, headers: noCacheHeaders() });
      }
      const valid = await bcrypt.compare(currentPassword, client.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400, headers: noCacheHeaders() });
      }
      const passwordHash = await bcrypt.hash(newPassword, 12);
      await prisma.client.update({ where: { id: clientId }, data: { passwordHash } });
      return NextResponse.json({ success: true }, { headers: noCacheHeaders() });
    }

    if (action === "email") {
      const { newEmail, password } = body;
      if (!newEmail || !password) {
        return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400, headers: noCacheHeaders() });
      }
      const normalizedEmail = newEmail.toLowerCase().trim();
      const client = await prisma.client.findUnique({ where: { id: clientId } });
      if (!client?.passwordHash) {
        return NextResponse.json({ error: "Aucun mot de passe défini" }, { status: 400, headers: noCacheHeaders() });
      }
      const valid = await bcrypt.compare(password, client.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 400, headers: noCacheHeaders() });
      }
      const existing = await prisma.client.findFirst({
        where: { email: normalizedEmail, NOT: { id: clientId } },
      });
      if (existing) {
        return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409, headers: noCacheHeaders() });
      }
      await prisma.client.update({ where: { id: clientId }, data: { email: normalizedEmail } });
      return NextResponse.json({ success: true }, { headers: noCacheHeaders() });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400, headers: noCacheHeaders() });
  } catch (error) {
    console.error("Account update error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500, headers: noCacheHeaders() });
  }
}
