import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { noCacheHeaders } from "@/lib/utils";

// Convert a UTC Date to its "YYYY-MM" bucket in Martinique timezone (UTC-4)
function mtnMonthKey(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: "America/Martinique" }).slice(0, 7);
}

// Build an ordered list of N calendar month strings "YYYY-MM" ending at the current
// Martinique month so rolling charts don't drift when UTC has crossed a month boundary.
function lastNMonths(n: number): string[] {
  const mtnNow = new Date().toLocaleDateString("en-CA", { timeZone: "America/Martinique" });
  const [y, m] = mtnNow.split("-").map(Number);
  const months: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
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
          include: { client: true, technicien: { select: { nom: true, initiales: true, couleur: true } } },
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

  // Start of rolling 24-month window in Martinique time
  const mtnNow = new Date().toLocaleDateString("en-CA", { timeZone: "America/Martinique" });
  const [mtnYear, mtnMonth] = mtnNow.split("-").map(Number);
  const rolling24Start = new Date(`${mtnYear}-${String(mtnMonth).padStart(2, "0")}-01T00:00:00-04:00`);
  rolling24Start.setMonth(rolling24Start.getMonth() - 23);

  const [tickets, rdvPeriode, enAttentePieces, allTickets24, livreHistos, allLivre24] = await Promise.all([
    // Tickets created (entrées) in the period
    prisma.ticket.findMany({
      where: { createdAt: { gte: fromDate, lte: toDate } },
      include: { client: { select: { nom: true, prenom: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.rendezVous.count({ where: { dateHeure: { gte: fromDate, lte: toDate } } }),
    prisma.ticket.count({ where: { statut: "ATTENTE_PIECES" } }),
    // Tickets created in last 24 months for rolling entrées charts
    prisma.ticket.findMany({
      where: { createdAt: { gte: rolling24Start } },
      select: { createdAt: true },
    }),
    // Historique LIVRE entries within the selected period (for KPIs)
    prisma.historique.findMany({
      where: { statut: "LIVRE", createdAt: { gte: fromDate, lte: toDate } },
      select: { ticketId: true, createdAt: true, ticket: { select: { createdAt: true } } },
      orderBy: { createdAt: "asc" },
    }),
    // Historique LIVRE entries in last 24 months for rolling sorties/réparées charts
    prisma.historique.findMany({
      where: { statut: "LIVRE", createdAt: { gte: rolling24Start } },
      select: { createdAt: true },
    }),
  ]);

  // KPIs
  const totalEntrees = tickets.length;

  // Deduplicate by ticketId — keep first LIVRE event per ticket within the period
  const livreByTicket = new Map<string, { entree: Date; sortie: Date }>();
  for (const h of livreHistos) {
    if (!livreByTicket.has(h.ticketId)) {
      livreByTicket.set(h.ticketId, { entree: h.ticket.createdAt, sortie: h.createdAt });
    }
  }
  const totalRepares    = livreByTicket.size;
  const machinesSorties = livreByTicket.size;
  const tauxReparation  = totalEntrees > 0 ? Math.round((totalRepares / totalEntrees) * 100) : 0;

  const delais = Array.from(livreByTicket.values()).map(
    ({ entree, sortie }) => (sortie.getTime() - entree.getTime()) / 86400000
  );
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

  // Par mois — last 12 months (rolling, Martinique timezone bucketing)
  const months12 = lastNMonths(12);
  const month12Entrees: Record<string, number> = Object.fromEntries(months12.map((m) => [m, 0]));
  for (const t of allTickets24) {
    const key = mtnMonthKey(t.createdAt);
    if (month12Entrees[key] !== undefined) month12Entrees[key]++;
  }
  const parMois = months12.map((m) => ({ month: monthLabel(m), count: month12Entrees[m] }));

  // Sorties par mois — last 12 months (when ticket became LIVRE)
  const month12Sorties: Record<string, number> = Object.fromEntries(months12.map((m) => [m, 0]));
  for (const h of allLivre24) {
    const key = mtnMonthKey(h.createdAt);
    if (month12Sorties[key] !== undefined) month12Sorties[key]++;
  }
  const parMoisSorties = months12.map((m) => ({ month: monthLabel(m), count: month12Sorties[m] }));

  // Taux par mois — sorties / entrées × 100 for each of the last 12 months
  const parMoisTaux = months12.map((m) => ({
    month: monthLabel(m),
    count: month12Entrees[m] > 0 ? Math.round((month12Sorties[m] / month12Entrees[m]) * 100) : 0,
  }));

  // Évolution — last 24 months (rolling, Martinique timezone bucketing)
  const months24 = lastNMonths(24);
  const month24Map: Record<string, number> = Object.fromEntries(months24.map((m) => [m, 0]));
  for (const t of allTickets24) {
    const key = mtnMonthKey(t.createdAt);
    if (month24Map[key] !== undefined) month24Map[key]++;
  }
  const evolution = months24.map((m) => ({ month: monthLabel(m), count: month24Map[m] }));

  // Full ticket list for export
  const ticketsList = tickets.map((t) => {
    const dateLivraison = livreByTicket.get(t.id)?.sortie ?? null;
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
      parMoisSorties,
      parMoisTaux,
      evolution,
      tickets: ticketsList,
    },
    { headers: noCacheHeaders() }
  );
}
