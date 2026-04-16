import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientSession } from "@/lib/auth";
import { generateTicketNumber, noCacheHeaders } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await getClientSession();
  if (!session?.client) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401, headers: noCacheHeaders() });
  }

  const tickets = await prisma.ticket.findMany({
    where: { clientId: session.client.id },
    orderBy: { createdAt: "desc" },
    include: {
      historique: { orderBy: { createdAt: "asc" } },
      technicien: { select: { nom: true } },
    },
  });

  return NextResponse.json(tickets, { headers: noCacheHeaders() });
}

export async function POST(request: NextRequest) {
  const session = await getClientSession();
  if (!session?.client) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401, headers: noCacheHeaders() });
  }

  try {
    const { materiel, marque, modele, numeroSerie, panneDeclaree } = await request.json();

    if (!materiel || !marque || !modele || !panneDeclaree) {
      return NextResponse.json(
        { error: "Matériel, marque, modèle et description de la panne sont requis" },
        { status: 400, headers: noCacheHeaders() }
      );
    }

    const numero = await generateTicketNumber(prisma);

    const ticket = await prisma.ticket.create({
      data: {
        numero,
        clientId: session.client.id,
        materiel,
        marque,
        modele,
        numeroSerie: numeroSerie || null,
        panneDeclaree,
        statut: "RECU",
      },
    });

    await prisma.historique.create({
      data: {
        ticketId: ticket.id,
        statut: "RECU",
        note: "Demande soumise en ligne par le client",
      },
    });

    return NextResponse.json(ticket, { status: 201, headers: noCacheHeaders() });
  } catch (error) {
    console.error("Create ticket error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500, headers: noCacheHeaders() });
  }
}
