import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { noCacheHeaders } from "@/lib/utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401, headers: noCacheHeaders() });
  }

  const { technicienId } = await request.json();

  const ticket = await prisma.ticket.update({
    where: { id: params.id },
    data: { technicienId: technicienId ?? null },
    include: {
      technicien: { select: { id: true, prenom: true, nom: true, initiales: true, couleur: true } },
    },
  });

  return NextResponse.json(ticket, { headers: noCacheHeaders() });
}
