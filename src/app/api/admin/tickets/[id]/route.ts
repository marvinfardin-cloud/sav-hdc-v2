import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { noCacheHeaders } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401, headers: noCacheHeaders() });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      technicien: { select: { id: true, prenom: true, nom: true, initiales: true, couleur: true } },
      historique: { orderBy: { createdAt: "asc" } },
      photos: true,
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket introuvable" }, { status: 404, headers: noCacheHeaders() });
  }

  // Mark as viewed by admin (fire-and-forget, don't delay response)
  if (!ticket.viewedByAdmin) {
    prisma.ticket.update({ where: { id: params.id }, data: { viewedByAdmin: true } }).catch(() => {});
  }

  return NextResponse.json(ticket, { headers: noCacheHeaders() });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401, headers: noCacheHeaders() });
  }

  try {
    const body = await request.json();
    const {
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

    const ticket = await prisma.ticket.update({
      where: { id: params.id },
      data: {
        materiel,
        marque,
        modele,
        numeroSerie: numeroSerie || null,
        panneDeclaree,
        notesPubliques: notesPubliques || null,
        notesPrivees: notesPrivees || null,
        technicienId: technicienId || null,
        dateEstimee: dateEstimee ? new Date(dateEstimee) : null,
      },
      include: {
        client: true,
        technicien: { select: { id: true, prenom: true, nom: true, initiales: true, couleur: true } },
        historique: { orderBy: { createdAt: "asc" } },
      },
    });

    return NextResponse.json(ticket, { headers: noCacheHeaders() });
  } catch (error) {
    console.error("Update ticket error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500, headers: noCacheHeaders() });
  }
}
