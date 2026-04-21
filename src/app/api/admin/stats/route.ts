import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { noCacheHeaders } from "@/lib/utils";

// Build an ordered list of N calendar month strings "YYYY-MM" ending at current month
function lastNMonths(n: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
}

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401, headers: noCacheHeaders() });
  }

  const { searchParams } = request.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // ── Dashboard mode (no date params) ─────────────────────────────────────────
  if (!from || !to) {
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/Martinique" });
    const today    = new Date(`${todayStr}T00:00:00-04:00`);
    const tomorrow = new Date(`${todayStr}T00:00:00-04:00`);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const [totalTickets, ticketsByStatus, todayAppointments, recentTickets, todayRdvs] =
      await Promise.all([
        prisma.ticket.count(),
        prisma.ticket.groupBy({ by: ["statut"], _count: true }),
        prisma.rendezVous.count({ where: { dateHeure: { gte: today, lt: tomorrow } } }),
        prisma.ticket.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          include: { client: true, technicien: { select: { nom: true } } },
        }),
        prisma.rendezVous.findMany({
          where: { dateHeure: { gte: today, lt: tomorrow } },
          orderBy: { dateHeure: "asc" },
          include: { client: true },
        }),
      ]);

    return NextResponse.json(
      { totalTickets, ticketsByStatus, todayAppointments, recentTickets, todayRdvs },
      { headers: noCacheHeaders() }
    );
  }

  // ── Stats report mode ────────────────────────────────────────────────────────
  const fromDate = new Date(`${from}T00:00:00-04:00`);
  const toDate   = new Date(`${to}T23:59:59.999-04:00`);

  const [tickets, rdvPeriode, enAttentePieces, allTickets24] = await Promise.all([
    prisma.ticket.findMany({
      where: { createdAt: { gte: fromDate, lte: toDate } },
      include: {
        client: { select: { nom: true, prenom: true } },
        historique: {
          where: { statut: "LIVRE" },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.rendezVous.count({ where: { dateHeure: { gte: fromDate, lte: toDate } } }),
    prisma.ticket.count({ where: { statut: "ATTENTE_PIECES" } }),
    // all tickets in last 24 months for rolling charts
    prisma.ticket.findMany({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth() - 23, 1),
        },
      },
      select: { createdAt: true },
    }),
  ]);

  // KPIs
  const totalEntrees = tickets.length;
  const livres = tickets.filter((t) => t.statut === "LIVRE");
  const totalRepares = livres.length;
  const tauxReparation = totalEntrees > 0 ? Math.round((totalRepares / totalEntrees) * 100) : 0;

  const livresAvecDate = livres.filter((t) => t.historique.length > 0);
  const machinesSorties = livresAvecDate.length;

  const delais = livresAvecDate
    .map((t) => Math.abs(t.historique[0].createdAt.getTime() - t.createdAt.getTime()) / 86400000);
  const delaiMoyen = delais.length > 0
    ? Math.round(delais.reduce((a, b) => a + b, 0) / delais.length)
    : 0;

  // Par statut (period)
  const statutMap: Record<string, number> = {};
  for (const t of tickets) {
    statutMap[t.statut] = (statutMap[t.statut] || 0) + 1;
  }
  const parStatut = Object.entries(statutMap).map(([name, value]) => ({ name, value }));

  // Par marque (period)
  const KNOWN_BRANDS = new Set(["STIHL", "BUGNOT", "GTS", "KIVA", "OREC", "RAPID"]);
  const marqueMap: Record<string, number> = {};
  for (const t of tickets) {
    const m = KNOWN_BRANDS.has(t.marque?.toUpperCase().trim()) ? t.marque.toUpperCase().trim() : "Autre";
    marqueMap[m] = (marqueMap[m] || 0) + 1;
  }
  const parMarque = Object.entries(marqueMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Par mois — last 12 months (rolling, not period-filtered)
  const months12 = lastNMonths(12);
  const month12Map: Record<string, number> = Object.fromEntries(months12.map((m) => [m, 0]));
  for (const t of allTickets24) {
    const key = `${t.createdAt.getFullYear()}-${String(t.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (month12Map[key] !== undefined) month12Map[key]++;
  }
  const parMois = months12.map((m) => ({ month: monthLabel(m), count: month12Map[m] }));

  // Évolution — last 24 months (rolling)
  const months24 = lastNMonths(24);
  const month24Map: Record<string, number> = Object.fromEntries(months24.map((m) => [m, 0]));
  for (const t of allTickets24) {
    const key = `${t.createdAt.getFullYear()}-${String(t.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (month24Map[key] !== undefined) month24Map[key]++;
  }
  const evolution = months24.map((m) => ({ month: monthLabel(m), count: month24Map[m] }));

  // Full ticket list for export
  const ticketsList = tickets.map((t) => {
    const dateLivraison = t.historique[0]?.createdAt ?? null;
    const delai = dateLivraison
      ? Math.round((dateLivraison.getTime() - t.createdAt.getTime()) / 86400000)
      : null;
    return {
      numero: t.numero,
      client: `${t.client.prenom} ${t.client.nom}`,
      materiel: t.materiel,
      marque: t.marque,
      statut: t.statut,
      dateEntree: t.createdAt.toISOString(),
      dateLivraison: dateLivraison?.toISOString() ?? null,
      delai,
    };
  });

  return NextResponse.json(
    {
      kpis: { totalEntrees, totalRepares, machinesSorties, tauxReparation, delaiMoyen, enAttentePieces, rdvPeriode },
      parStatut,
      parMarque,
      parMois,
      evolution,
      tickets: ticketsList,
    },
    { headers: noCacheHeaders() }
  );
}
