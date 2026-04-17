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
  const view = searchParams.get("view") || "day";

  // Default to today in Martinique time (UTC-4, no DST)
  const nowMQ = new Date(Date.now() - 4 * 60 * 60 * 1000);
  const defaultDate = nowMQ.toISOString().split("T")[0];
  const dateStr = searchParams.get("date") || defaultDate;

  // Parse date as Martinique local midnight (UTC-4)
  let startDate = new Date(`${dateStr}T00:00:00-04:00`);
  let endDate: Date;

  if (view === "week") {
    // Align to Monday of the week using getDay() on the Martinique date
    const [y, mo, d] = dateStr.split("-").map(Number);
    const dayOfWeek = new Date(y, mo - 1, d).getDay(); // 0=Sun … 6=Sat
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate = new Date(startDate.getTime() + diff * 24 * 60 * 60 * 1000);
    endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  } else {
    endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
  }

  const rdvs = await prisma.rendezVous.findMany({
    where: {
      dateHeure: { gte: startDate, lt: endDate },
      statut: { not: "annule" },
    },
    orderBy: { dateHeure: "asc" },
    include: {
      client: {
        include: {
          tickets: {
            orderBy: { dateDepot: "desc" },
            take: 1,
            select: { numero: true, materiel: true, marque: true, modele: true },
          },
        },
      },
    },
  });

  return NextResponse.json({ rdvs, startDate, endDate }, { headers: noCacheHeaders() });
}
