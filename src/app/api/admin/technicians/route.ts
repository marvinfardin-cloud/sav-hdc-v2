import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { noCacheHeaders } from "@/lib/utils";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401, headers: noCacheHeaders() });
  }

  const technicians = await prisma.technician.findMany({
    orderBy: { nom: "asc" },
  });

  return NextResponse.json(technicians, { headers: noCacheHeaders() });
}
