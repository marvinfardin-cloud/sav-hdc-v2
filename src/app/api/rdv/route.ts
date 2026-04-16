import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientSession } from "@/lib/auth";
import { sendRdvConfirmation } from "@/lib/email";
import { sendWhatsAppRdvConfirmation } from "@/lib/whatsapp";
import { noCacheHeaders } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const session = await getClientSession();
  if (!session?.client) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401, headers: noCacheHeaders() });
  }

  try {
    const { date, time, type, notes } = await request.json();

    if (!date || !time || !type) {
      return NextResponse.json(
        { error: "Date, heure et type requis" },
        { status: 400, headers: noCacheHeaders() }
      );
    }

    const [hours, minutes] = time.split(":").map(Number);
    const dateHeure = new Date(date);
    dateHeure.setHours(hours, minutes, 0, 0);

    // Check if slot is still available
    const startWindow = new Date(dateHeure.getTime() - 1000);
    const endWindow = new Date(dateHeure.getTime() + 1000);

    const conflict = await prisma.rendezVous.findFirst({
      where: {
        dateHeure: { gte: startWindow, lte: endWindow },
        statut: { not: "annule" },
      },
    });

    if (conflict) {
      return NextResponse.json(
        { error: "Ce créneau n'est plus disponible" },
        { status: 409, headers: noCacheHeaders() }
      );
    }

    const rdv = await prisma.rendezVous.create({
      data: {
        clientId: session.client.id,
        dateHeure,
        type,
        notes: notes || null,
        statut: "confirme",
      },
      include: { client: true },
    });

    // Send notifications
    const notifications: Promise<unknown>[] = [];

    notifications.push(
      sendRdvConfirmation(session.client.email, session.client.prenom, {
        dateHeure: rdv.dateHeure,
        type: rdv.type,
        notes: rdv.notes,
      }).catch((e) => console.error("RDV email error:", e))
    );

    if (session.client.telephone) {
      notifications.push(
        sendWhatsAppRdvConfirmation(session.client.telephone, session.client.prenom, {
          dateHeure: rdv.dateHeure,
          type: rdv.type,
        }).catch((e) => console.error("RDV WhatsApp error:", e))
      );
    }

    await Promise.all(notifications);

    return NextResponse.json(rdv, { status: 201, headers: noCacheHeaders() });
  } catch (error) {
    console.error("Create RDV error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500, headers: noCacheHeaders() });
  }
}
