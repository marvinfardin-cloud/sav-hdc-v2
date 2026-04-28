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

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      tickets: {
        orderBy: { createdAt: "desc" },
        include: {
          historique: { orderBy: { createdAt: "asc" } },
          technicien: { select: { nom: true } },
        },
      },
      rdvs: { orderBy: { dateHeure: "desc" } },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404, headers: noCacheHeaders() });
  }

  return NextResponse.json(client, { headers: noCacheHeaders() });
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
    const { nom, prenom, telephone } = await request.json();

    const client = await prisma.client.update({
      where: { id: params.id },
      data: { nom, prenom, telephone: telephone || null },
    });

    return NextResponse.json(client, { headers: noCacheHeaders() });
  } catch (error) {
    console.error("Update client error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500, headers: noCacheHeaders() });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401, headers: noCacheHeaders() });
  }

  try {
    const { nom, email, telephone } = await request.json();

    const data: Record<string, string | null> = {};
    if (nom !== undefined)       data.nom       = nom.trim();
    if (email !== undefined)     data.email     = email.toLowerCase().trim();
    if (telephone !== undefined) data.telephone = telephone?.trim() || null;

    const client = await prisma.client.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(client, { headers: noCacheHeaders() });
  } catch (error) {
    console.error("Update client error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500, headers: noCacheHeaders() });
  }
}
