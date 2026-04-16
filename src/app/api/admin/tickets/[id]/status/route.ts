import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { sendStatusUpdate } from "@/lib/email";
import { sendWhatsAppStatusUpdate } from "@/lib/whatsapp";
import { noCacheHeaders } from "@/lib/utils";
import { Statut } from "@/generated/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401, headers: noCacheHeaders() });
  }

  try {
    const { statut, note, notifyEmail, notifyWhatsapp } = await request.json();

    if (!statut) {
      return NextResponse.json(
        { error: "Statut requis" },
        { status: 400, headers: noCacheHeaders() }
      );
    }

    const ticket = await prisma.ticket.update({
      where: { id: params.id },
      data: {
        statut: statut as Statut,
        historique: {
          create: { statut: statut as Statut, note: note || null },
        },
      },
      include: {
        client: true,
        historique: { orderBy: { createdAt: "asc" } },
        technicien: { select: { nom: true } },
      },
    });

    // Send notifications
    const notifications: Promise<unknown>[] = [];

    if (notifyEmail) {
      notifications.push(
        sendStatusUpdate(ticket.client.email, ticket.client.prenom, {
          numero: ticket.numero,
          materiel: ticket.materiel,
          marque: ticket.marque,
          modele: ticket.modele,
          statut: ticket.statut,
          notesPubliques: ticket.notesPubliques,
          dateEstimee: ticket.dateEstimee,
        }).catch((e) => console.error("Email send error:", e))
      );
    }

    if (notifyWhatsapp && ticket.client.telephone) {
      notifications.push(
        sendWhatsAppStatusUpdate(ticket.client.telephone, ticket.client.prenom, {
          numero: ticket.numero,
          materiel: ticket.materiel,
          statut: ticket.statut,
        }).catch((e) => console.error("WhatsApp send error:", e))
      );
    }

    await Promise.all(notifications);

    return NextResponse.json(ticket, { headers: noCacheHeaders() });
  } catch (error) {
    console.error("Status update error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500, headers: noCacheHeaders() });
  }
}
