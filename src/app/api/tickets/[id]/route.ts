import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientSession } from "@/lib/auth";
import { noCacheHeaders } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getClientSession();
  if (!session?.client) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401, headers: noCacheHeaders() });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: {
      historique: { orderBy: { createdAt: "asc" } },
      technicien: { select: { nom: true } },
      photos: true,
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket introuvable" }, { status: 404, headers: noCacheHeaders() });
  }

  // Ensure client can only see their own tickets
  if (ticket.clientId !== session.client.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403, headers: noCacheHeaders() });
  }

  return NextResponse.json(ticket, { headers: noCacheHeaders() });
}
