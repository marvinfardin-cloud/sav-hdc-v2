import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { sendWhatsAppCustomMessage } from "@/lib/whatsapp";
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
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message requis" },
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

    if (!ticket.client.telephone) {
      return NextResponse.json(
        { error: "Ce client n'a pas de numéro de téléphone" },
        { status: 400, headers: noCacheHeaders() }
      );
    }

    const result = await sendWhatsAppCustomMessage(ticket.client.telephone, message);

    if (!result.success) {
      return NextResponse.json(
        { error: "Erreur lors de l'envoi WhatsApp" },
        { status: 500, headers: noCacheHeaders() }
      );
    }

    return NextResponse.json(
      { success: true, message: "WhatsApp envoyé avec succès" },
      { headers: noCacheHeaders() }
    );
  } catch (error) {
    console.error("Send WhatsApp error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi" },
      { status: 500, headers: noCacheHeaders() }
    );
  }
}
