import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { noCacheHeaders } from "@/lib/utils";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401, headers: noCacheHeaders() });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    select: { statut: true },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket introuvable" }, { status: 404, headers: noCacheHeaders() });
  }

  if (ticket.statut !== "LIVRE") {
    return NextResponse.json(
      { error: "Seul un ticket au statut 'Livré' peut être clôturé" },
      { status: 400, headers: noCacheHeaders() }
    );
  }

  const updated = await prisma.ticket.update({
    where: { id: params.id },
    data: {
      statut: "CLOTURE",
      closedAt: new Date(),
      historique: { create: { statut: "CLOTURE", note: "Ticket clôturé" } },
    },
  });

  return NextResponse.json(updated, { headers: noCacheHeaders() });
}
