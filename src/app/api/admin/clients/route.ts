import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { noCacheHeaders } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401, headers: noCacheHeaders() });
  }

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search");

  const where = search
    ? {
        OR: [
          { nom: { contains: search, mode: "insensitive" as const } },
          { prenom: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { telephone: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const clients = await prisma.client.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { tickets: true, rdvs: true } },
    },
  });

  return NextResponse.json(clients, { headers: noCacheHeaders() });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401, headers: noCacheHeaders() });
  }

  try {
    const { email, nom, prenom, telephone } = await request.json();

    if (!email || !nom || !prenom) {
      return NextResponse.json(
        { error: "Email, nom et prénom requis" },
        { status: 400, headers: noCacheHeaders() }
      );
    }

    const existing = await prisma.client.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Un client avec cet email existe déjà" },
        { status: 409, headers: noCacheHeaders() }
      );
    }

    const client = await prisma.client.create({
      data: {
        email: email.toLowerCase(),
        nom,
        prenom,
        telephone: telephone || null,
      },
    });

    return NextResponse.json(client, { status: 201, headers: noCacheHeaders() });
  } catch (error) {
    console.error("Create client error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500, headers: noCacheHeaders() });
  }
}
