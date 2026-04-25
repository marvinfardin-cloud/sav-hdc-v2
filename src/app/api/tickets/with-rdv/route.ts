import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientSession } from "@/lib/auth";
import { generateTicketNumber, noCacheHeaders } from "@/lib/utils";
import { sendTicketWithRdvConfirmation } from "@/lib/email";

export async function POST(request: NextRequest) {
  const session = await getClientSession();
  if (!session?.client) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401, headers: noCacheHeaders() });
  }

  try {
    const { materiel, marque, modele, panneDeclaree, rdvDate, rdvTime, photoDataUrl } =
      await request.json();

    if (!materiel || !marque || !modele || !panneDeclaree || !rdvDate || !rdvTime) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être remplis" },
        { status: 400, headers: noCacheHeaders() }
      );
    }

    // Parse RDV datetime as Martinique local (UTC-4)
    const dateHeure = new Date(`${rdvDate}T${rdvTime}:00-04:00`);

    // 409 conflict check
    const conflict = await prisma.rendezVous.findFirst({
      where: {
        dateHeure: {
          gte: new Date(dateHeure.getTime() - 1000),
          lte: new Date(dateHeure.getTime() + 1000),
        },
        statut: { not: "annule" },
      },
    });

    if (conflict) {
      return NextResponse.json(
        { error: "Ce créneau vient d'être pris, veuillez en choisir un autre" },
        { status: 409, headers: noCacheHeaders() }
      );
    }

    const numero = await generateTicketNumber(prisma);

    const [ticket, rdv] = await prisma.$transaction([
      prisma.ticket.create({
        data: {
          numero,
          clientId: session.client.id,
          materiel,
          marque,
          modele,
          panneDeclaree,
          statut: "RECU",
        },
      }),
      prisma.rendezVous.create({
        data: {
          clientId: session.client.id,
          dateHeure,
          type: "depot",
          statut: "confirme",
        },
      }),
    ]);

    await prisma.historique.create({
      data: {
        ticketId: ticket.id,
        statut: "RECU",
        note: "Demande soumise en ligne avec rendez-vous de dépôt",
      },
    });

    if (photoDataUrl) {
      await prisma.photo.create({
        data: { ticketId: ticket.id, url: photoDataUrl, type: "client" },
      });
    }

    sendTicketWithRdvConfirmation(session.client.email, session.client.prenom, {
      ticketNumero: ticket.numero,
      marque: ticket.marque,
      modele: ticket.modele,
      materiel: ticket.materiel,
      panneDeclaree: ticket.panneDeclaree,
      rdvDateHeure: rdv.dateHeure,
    }).catch((e) => console.error("Ticket+RDV email error:", e));

    return NextResponse.json({ ticket, rdv }, { status: 201, headers: noCacheHeaders() });
  } catch (error) {
    console.error("Create ticket+RDV error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500, headers: noCacheHeaders() });
  }
}
