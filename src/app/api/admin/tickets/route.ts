import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { generateTicketNumber, noCacheHeaders } from "@/lib/utils";
import { Statut } from "@/generated/prisma";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401, headers: noCacheHeaders() });
  }

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (status === "active") {
    where.statut = { notIn: ["LIVRE"] };
  } else if (status) {
    where.statut = status as Statut;
  }
  if (search) {
    where.OR = [
      { numero: { contains: search, mode: "insensitive" } },
      { materiel: { contains: search, mode: "insensitive" } },
      { marque: { contains: search, mode: "insensitive" } },
      { modele: { contains: search, mode: "insensitive" } },
      { client: { nom: { contains: search, mode: "insensitive" } } },
      { client: { prenom: { contains: search, mode: "insensitive" } } },
    ];
  }

  const tickets = await prisma.ticket.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      client: true,
      technicien: { select: { id: true, nom: true } },
      _count: { select: { messages: { where: { senderType: "CLIENT", readAt: null } } } },
    },
  });

  return NextResponse.json(tickets, { headers: noCacheHeaders() });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401, headers: noCacheHeaders() });
  }

  try {
    const body = await request.json();
    const {
      clientId,
      materiel,
      marque,
      modele,
      numeroSerie,
      panneDeclaree,
      notesPubliques,
      notesPrivees,
      technicienId,
      dateEstimee,
    } = body;

    if (!clientId || !materiel || !marque || !modele || !panneDeclaree) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants" },
        { status: 400, headers: noCacheHeaders() }
      );
    }

    const numero = await generateTicketNumber(prisma);

    const ticket = await prisma.ticket.create({
      data: {
        numero,
        clientId,
        materiel,
        marque,
        modele,
        numeroSerie: numeroSerie || null,
        panneDeclaree,
        notesPubliques: notesPubliques || null,
        notesPrivees: notesPrivees || null,
        technicienId: technicienId || null,
        dateEstimee: dateEstimee ? new Date(dateEstimee) : null,
        historique: {
          create: {
            statut: "RECU",
            note: "Ticket créé - Appareil réceptionné",
          },
        },
      },
      include: { client: true, technicien: { select: { nom: true } } },
    });

    return NextResponse.json(ticket, { status: 201, headers: noCacheHeaders() });
  } catch (error) {
    console.error("Create ticket error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500, headers: noCacheHeaders() });
  }
}
