import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { noCacheHeaders } from "@/lib/utils";

function mtnMonthKey(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: "America/Martinique" }).slice(0, 7);
}

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

// Returns the Monday (YYYY-MM-DD) of the week that contains `date` (Martinique-bucketed)
function mondayOf(date: Date): string {
  const mtnStr = date.toLocaleDateString("en-CA", { timeZone: "America/Martinique" });
  const d = new Date(mtnStr + "T12:00:00");
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return d.toLocaleDateString("en-CA");
}

function weekLabel(mondayStr: string): string {
  const d = new Date(mondayStr + "T12:00:00");
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401, headers: noCacheHeaders() });
  }

  const { searchParams } = request.nextUrl;
  const mtnToday = new Date().toLocaleDateString("en-CA", { timeZone: "America/Martinique" });
  const from = searchParams.get("from") ?? mtnToday.slice(0, 7) + "-01";
  const to   = searchParams.get("to")   ?? mtnToday;
  const techIdFilter = searchParams.get("techId") || null;
  const marqueFilter = searchParams.get("marque") || null;

  const fromDate = new Date(`${from}T00:00:00-04:00`);
  const toDate   = new Date(`${to}T23:59:59.999-04:00`);

  // Rolling 12-month start in Martinique time
  const [mtnYear, mtnMonth] = mtnToday.split("-").map(Number);
  const rolling12Start = new Date(
    `${mtnYear}-${String(mtnMonth).padStart(2, "0")}-01T00:00:00-04:00`
  );
  rolling12Start.setMonth(rolling12Start.getMonth() - 11);

  const marqueWhere = marqueFilter
    ? { marque: { equals: marqueFilter, mode: "insensitive" as const } }
    : {};

  const [technicians, ticketsPeriod, livreHistosPeriod, allLivre12] = await Promise.all([
    prisma.technician.findMany({ orderBy: { prenom: "asc" } }),

    // Tickets assigned to techs in the period
    prisma.ticket.findMany({
      where: {
        createdAt: { gte: fromDate, lte: toDate },
        technicienId: techIdFilter ? techIdFilter : { not: null },
        ...marqueWhere,
      },
      select: { id: true, technicienId: true, createdAt: true },
    }),

    // Historique LIVRE events within period for tech-assigned tickets
    prisma.historique.findMany({
      where: {
        statut: "LIVRE",
        createdAt: { gte: fromDate, lte: toDate },
        ticket: {
          technicienId: techIdFilter ? techIdFilter : { not: null },
          ...marqueWhere,
        },
      },
      select: {
        createdAt: true,
        ticketId: true,
        ticket: { select: { technicienId: true, createdAt: true } },
      },
    }),

    // Historique LIVRE for rolling 12-month monthly evolution
    prisma.historique.findMany({
      where: {
        statut: "LIVRE",
        createdAt: { gte: rolling12Start },
        ticket: {
          technicienId: techIdFilter ? techIdFilter : { not: null },
          ...marqueWhere,
        },
      },
      select: {
        createdAt: true,
        ticket: { select: { technicienId: true } },
      },
    }),
  ]);

  const techMap = new Map(technicians.map((t) => [t.id, t]));

  // ── Per-tech ticket counts in period ─────────────────────────────────────
  const ticketsByTech: Record<string, number> = {};
  for (const t of ticketsPeriod) {
    if (t.technicienId) ticketsByTech[t.technicienId] = (ticketsByTech[t.technicienId] || 0) + 1;
  }

  // ── Dedup LIVRE per ticket (first event wins) in period ───────────────────
  interface LiveEntry { techId: string; entree: Date; sortie: Date }
  const livreByTicket = new Map<string, LiveEntry>();
  for (const h of livreHistosPeriod) {
    if (!livreByTicket.has(h.ticketId) && h.ticket.technicienId) {
      livreByTicket.set(h.ticketId, {
        techId: h.ticket.technicienId,
        entree: h.ticket.createdAt,
        sortie: h.createdAt,
      });
    }
  }

  // ── Per-tech repair stats ─────────────────────────────────────────────────
  const reparesByTech: Record<string, { count: number; totalDelai: number }> = {};
  for (const { techId, entree, sortie } of Array.from(livreByTicket.values())) {
    if (!reparesByTech[techId]) reparesByTech[techId] = { count: 0, totalDelai: 0 };
    reparesByTech[techId].count++;
    reparesByTech[techId].totalDelai += (sortie.getTime() - entree.getTime()) / 86400000;
  }

  // ── Last activity per tech ────────────────────────────────────────────────
  const lastActivityByTech: Record<string, Date> = {};
  for (const h of livreHistosPeriod) {
    if (h.ticket.technicienId) {
      const existing = lastActivityByTech[h.ticket.technicienId];
      if (!existing || h.createdAt > existing) {
        lastActivityByTech[h.ticket.technicienId] = h.createdAt;
      }
    }
  }

  // ── Ranking ───────────────────────────────────────────────────────────────
  const ranking = technicians.map((tech) => {
    const tickets    = ticketsByTech[tech.id] || 0;
    const r          = reparesByTech[tech.id];
    const repares    = r?.count ?? 0;
    const delaiMoyen = r && r.count > 0 ? Math.round(r.totalDelai / r.count) : 0;
    const taux       = tickets > 0 ? Math.round((repares / tickets) * 100) : 0;
    const lastAct    = lastActivityByTech[tech.id];
    return {
      id: tech.id, prenom: tech.prenom, nom: tech.nom,
      initiales: tech.initiales, couleur: tech.couleur,
      tickets, repares, taux, delaiMoyen,
      lastActivity: lastAct ? lastAct.toISOString() : null,
    };
  });

  // ── Aggregate KPIs ────────────────────────────────────────────────────────
  const totalTickets = ranking.reduce((s, r) => s + r.tickets, 0);
  const totalRepares = ranking.reduce((s, r) => s + r.repares, 0);
  const tauxGlobal   = totalTickets > 0 ? Math.round((totalRepares / totalTickets) * 100) : 0;
  const activeTechs  = ranking.filter((r) => r.delaiMoyen > 0);
  const delaiGlobal  = activeTechs.length > 0
    ? Math.round(activeTechs.reduce((s, r) => s + r.delaiMoyen, 0) / activeTechs.length)
    : 0;

  // ── Weekly bars ───────────────────────────────────────────────────────────
  // Build list of all Mondays in the [from, to] range
  const mondays: string[] = [];
  const cur = new Date(from + "T12:00:00");
  const end = new Date(to + "T12:00:00");
  const startDay = cur.getDay() || 7;
  cur.setDate(cur.getDate() - startDay + 1);
  while (cur <= end) {
    mondays.push(cur.toLocaleDateString("en-CA"));
    cur.setDate(cur.getDate() + 7);
  }

  const currentWeekMonday = mondayOf(new Date());

  // Count LIVRE events per week per tech
  const weeklyRaw: Record<string, Record<string, number>> = {};
  for (const monday of mondays) {
    weeklyRaw[monday] = {};
    for (const tech of technicians) weeklyRaw[monday][tech.initiales] = 0;
  }
  for (const [, { techId, sortie }] of Array.from(livreByTicket.entries())) {
    const monday = mondayOf(sortie);
    if (weeklyRaw[monday]) {
      const tech = techMap.get(techId);
      if (tech) weeklyRaw[monday][tech.initiales] = (weeklyRaw[monday][tech.initiales] || 0) + 1;
    }
  }

  const weeklyBars = mondays.map((monday) => ({
    week: weekLabel(monday),
    isCurrent: monday === currentWeekMonday,
    ...weeklyRaw[monday],
  }));

  // ── Monthly evolution (12 months) ────────────────────────────────────────
  const months12 = lastNMonths(12);
  const monthlyRaw: Record<string, Record<string, number>> = {};
  for (const m of months12) {
    monthlyRaw[m] = {};
    for (const tech of technicians) monthlyRaw[m][tech.initiales] = 0;
  }
  for (const h of allLivre12) {
    if (!h.ticket.technicienId) continue;
    const key  = mtnMonthKey(h.createdAt);
    const tech = techMap.get(h.ticket.technicienId);
    if (tech && monthlyRaw[key]) {
      monthlyRaw[key][tech.initiales] = (monthlyRaw[key][tech.initiales] || 0) + 1;
    }
  }
  const monthlyEvolution = months12.map((m) => ({ month: monthLabel(m), ...monthlyRaw[m] }));

  return NextResponse.json(
    {
      technicians: technicians.map((t) => ({
        id: t.id, prenom: t.prenom, nom: t.nom, initiales: t.initiales, couleur: t.couleur,
      })),
      kpis: { totalTickets, totalRepares, tauxGlobal, delaiGlobal },
      ranking,
      weeklyBars,
      monthlyEvolution,
    },
    { headers: noCacheHeaders() }
  );
}
