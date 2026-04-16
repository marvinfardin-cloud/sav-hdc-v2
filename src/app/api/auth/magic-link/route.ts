import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createMagicLinkToken } from "@/lib/auth";
import { sendMagicLink } from "@/lib/email";
import { noCacheHeaders } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email requis" },
        { status: 400, headers: noCacheHeaders() }
      );
    }

    const client = await prisma.client.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to avoid email enumeration
    if (!client) {
      return NextResponse.json(
        { success: true, message: "Si cet email est enregistré, vous recevrez un lien de connexion." },
        { status: 200, headers: noCacheHeaders() }
      );
    }

    const token = await createMagicLinkToken(client.id);
    await sendMagicLink(client.email, client.prenom, token);

    return NextResponse.json(
      { success: true, message: "Lien de connexion envoyé par email." },
      { status: 200, headers: noCacheHeaders() }
    );
  } catch (error) {
    console.error("Magic link error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500, headers: noCacheHeaders() }
    );
  }
}
