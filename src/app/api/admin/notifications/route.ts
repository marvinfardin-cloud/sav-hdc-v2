import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { noCacheHeaders } from "@/lib/utils";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401, headers: noCacheHeaders() });
  }

  const tickets = await prisma.ticket.findMany({
    where: { statut: "RECU", viewedByAdmin: false },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      numero: true,
      materiel: true,
      marque: true,
      modele: true,
      createdAt: true,
      client: { select: { nom: true, prenom: true } },
    },
  });

  return NextResponse.json(
    { count: tickets.length, tickets },
    { headers: noCacheHeaders() }
  );
}
