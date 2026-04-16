import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { noCacheHeaders } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401, headers: noCacheHeaders() });
  }

  // Build today's window using Martinique midnight (UTC-4, no DST).
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/Martinique" });
  const today    = new Date(`${todayStr}T00:00:00-04:00`);
  const tomorrow = new Date(`${todayStr}T00:00:00-04:00`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const [
    totalTickets,
    ticketsByStatus,
    todayAppointments,
    recentTickets,
    todayRdvs,
  ] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.groupBy({ by: ["statut"], _count: true }),
    prisma.rendezVous.count({
      where: { dateHeure: { gte: today, lt: tomorrow } },
    }),
    prisma.ticket.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        client: true,
        technicien: { select: { nom: true } },
      },
    }),
    prisma.rendezVous.findMany({
      where: { dateHeure: { gte: today, lt: tomorrow } },
      orderBy: { dateHeure: "asc" },
      include: { client: true },
    }),
  ]);

  return NextResponse.json(
    {
      totalTickets,
      ticketsByStatus,
      todayAppointments,
      recentTickets,
      todayRdvs,
    },
    { headers: noCacheHeaders() }
  );
}
