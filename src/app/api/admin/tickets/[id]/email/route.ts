import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { sendCustomEmail } from "@/lib/email";
import { noCacheHeaders } from "@/lib/utils";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401, headers: noCacheHeaders() });
  }

  try {
    const { subject, message } = await request.json();

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Sujet et message requis" },
        { status: 400, headers: noCacheHeaders() }
      );
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: { client: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket introuvable" }, { status: 404, headers: noCacheHeaders() });
    }

    await sendCustomEmail(
      ticket.client.email,
      ticket.client.prenom,
      subject,
      message,
      ticket.numero
    );

    return NextResponse.json(
      { success: true, message: "Email envoyé avec succès" },
      { headers: noCacheHeaders() }
    );
  } catch (error) {
    console.error("Send email error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi" },
      { status: 500, headers: noCacheHeaders() }
    );
  }
}
