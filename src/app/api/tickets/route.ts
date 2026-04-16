import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientSession } from "@/lib/auth";
import { noCacheHeaders } from "@/lib/utils";

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
