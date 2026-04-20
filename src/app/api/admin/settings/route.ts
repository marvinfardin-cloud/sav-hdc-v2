import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { noCacheHeaders } from "@/lib/utils";
import bcrypt from "bcryptjs";

export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401, headers: noCacheHeaders() });
  }

  const body = await request.json();
  const { type } = body;

  if (type === "email") {
    const { newEmail, password } = body;

    if (!newEmail || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400, headers: noCacheHeaders() });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404, headers: noCacheHeaders() });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401, headers: noCacheHeaders() });
    }

    const existing = await prisma.user.findUnique({ where: { email: newEmail.toLowerCase() } });
    if (existing && existing.id !== user.id) {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409, headers: noCacheHeaders() });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { email: newEmail.toLowerCase() },
    });

    return NextResponse.json({ ok: true }, { headers: noCacheHeaders() });
  }

  if (type === "password") {
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Mot de passe actuel et nouveau requis" }, { status: 400, headers: noCacheHeaders() });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Le nouveau mot de passe doit contenir au moins 8 caractères" }, { status: 400, headers: noCacheHeaders() });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404, headers: noCacheHeaders() });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 401, headers: noCacheHeaders() });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    return NextResponse.json({ ok: true }, { headers: noCacheHeaders() });
  }

  return NextResponse.json({ error: "Type d'action invalide" }, { status: 400, headers: noCacheHeaders() });
}
