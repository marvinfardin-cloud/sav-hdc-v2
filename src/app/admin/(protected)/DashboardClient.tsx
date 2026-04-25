"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDate, formatTime, RDV_TYPE_LABELS } from "@/lib/utils";
import { ResponsiveContainer, LineChart, Line } from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StatsData {
  totalTickets: number;
  ticketsByStatus: { statut: string; _count: number }[];
  todayAppointments: number;
  recentTickets: RecentTicket[];
  todayRdvs: TodayRdv[];
}

interface RecentTicket {
  id: string;
  numero: string;
  materiel: string;
  marque: string;
  modele: string;
  statut: string;
  createdAt: string;
  client: { nom: string; prenom: string };
  technicien?: { nom: string } | null;
}

interface TodayRdv {
  id: string;
  dateHeure: string;
  type: string;
  statut: string;
  notes?: string;
  client: { nom: string; prenom: string; telephone?: string };
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  RECU:           { label: "Reçu",           color: "#3B82F6" },
  DIAGNOSTIC:     { label: "Diagnostic",     color: "#8B5CF6" },
  ATTENTE_PIECES: { label: "Attente pièces", color: "#6B7280" },
  EN_REPARATION:  { label: "En réparation",  color: "#F47920" },
  PRET:           { label: "Prêt",           color: "#22C55E" },
  LIVRE:          { label: "Livré",          color: "#10B981" },
};

const STATUS_ORDER = ["RECU", "DIAGNOSTIC", "ATTENTE_PIECES", "EN_REPARATION", "PRET", "LIVRE"];

const RDV_COLOR: Record<string, string> = {
  depot:      "#3b82f6",
  retrait:    "#22c55e",
  diagnostic: "#F47920",
};

// Hours shown in the time grid
const GRID_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(nom: string): string {
  const parts = nom.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function rdvHour(dateHeure: string): number {
  const hm = new Date(dateHeure).toLocaleTimeString("fr-FR", {
    hour: "2-digit", minute: "2-digit", timeZone: "America/Martinique",
  });
  return parseInt(hm.split(":")[0], 10);
}

function mtnToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Martinique" });
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="animate-spin w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}

// ── SparkLine ─────────────────────────────────────────────────────────────────

function SparkLine({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const points = data.map((count, i) => ({ i, count }));
  return (
    <ResponsiveContainer width="100%" height={32}>
      <LineChart data={points} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <Line
          type="monotone"
          dataKey="count"
          stroke="#F47920"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, accentColor, icon, href, sparkData,
}: {
  label: string; value: number; sub: string;
  accentColor: string; icon: React.ReactNode; href: string;
  sparkData: number[];
}) {
  return (
    <Link
      href={href}
      className="block bg-[#111111] border border-[#1f1f1f] rounded-xl p-4 hover:border-[#2a2a2a] transition-colors group"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider leading-tight">{label}</p>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
          style={{ backgroundColor: `${accentColor}18` }}
        >
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-white leading-none" style={{ letterSpacing: "-1.5px", fontVariantNumeric: "tabular-nums" }}>
        {value}
      </p>
      <p className="text-xs text-zinc-600 mt-1">{sub}</p>
      {/* Sparkline */}
      <div className="mt-1 -mx-1">
        <SparkLine data={sparkData} />
      </div>
      <div className="pt-2 border-t border-[#1a1a1a] flex items-center justify-between">
        <span className="text-[11px] font-semibold" style={{ color: accentColor }}>Voir les détails</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="m9 6 6 6-6 6" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </Link>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ statut }: { statut: string }) {
  const cfg = STATUS_CONFIG[statut] ?? { label: statut, color: "#6b7280" };
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5 whitespace-nowrap"
      style={{ color: cfg.color, backgroundColor: `${cfg.color}18` }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
      {cfg.label}
    </span>
  );
}

// ── Kanban column ─────────────────────────────────────────────────────────────

function KanbanColumn({
  statut, count, tickets, sortAsc,
}: {
  statut: string; count: number; tickets: RecentTicket[]; sortAsc: boolean;
}) {
  const { label, color } = STATUS_CONFIG[statut] ?? { label: statut, color: "#6b7280" };

  const sorted = [...tickets].sort((a, b) => {
    const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return sortAsc ? diff : -diff;
  });

  return (
    <div className="flex-none w-44">
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-[11px] font-semibold text-zinc-400 truncate">{label}</span>
        </div>
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ml-1"
          style={{ color, backgroundColor: `${color}18` }}
        >
          {count}
        </span>
      </div>

      <div className="space-y-1.5">
        {sorted.map((ticket) => (
          <Link
            key={ticket.id}
            href={`/admin/tickets/${ticket.id}`}
            className="block bg-[#161616] border border-[#252525] rounded-lg p-2.5 hover:border-[#333] transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold" style={{ color: "#F47920" }}>
                {ticket.numero}
              </span>
              {ticket.technicien && (
                <span
                  className="w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${color}22`, color }}
                >
                  {initials(ticket.technicien.nom)}
                </span>
              )}
            </div>
            <p className="text-[11px] font-medium text-zinc-300 truncate">
              {ticket.client.prenom} {ticket.client.nom}
            </p>
            <p className="text-[10px] text-zinc-600 truncate mt-0.5">
              {ticket.marque} {ticket.modele}
            </p>
          </Link>
        ))}

        {sorted.length === 0 && count === 0 && (
          <div className="border border-dashed border-[#252525] rounded-lg px-2 py-4 text-center">
            <p className="text-[10px] text-zinc-700">Vide</p>
          </div>
        )}
        {sorted.length === 0 && count > 0 && (
          <Link
            href={`/admin/tickets?status=${statut}`}
            className="block border border-dashed border-[#252525] rounded-lg px-2 py-4 text-center hover:border-[#333] transition-colors"
          >
            <p className="text-[10px]" style={{ color }}>
              {count} ticket{count > 1 ? "s" : ""}
            </p>
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Time grid ─────────────────────────────────────────────────────────────────

function TimeGrid({ rdvs }: { rdvs: TodayRdv[] }) {
  // Group RDVs by their hour bucket (floor to hour)
  const byHour: Record<number, TodayRdv[]> = {};
  for (const rdv of rdvs) {
    const h = rdvHour(rdv.dateHeure);
    if (!byHour[h]) byHour[h] = [];
    byHour[h].push(rdv);
  }

  return (
    <div className="space-y-0.5">
      {GRID_HOURS.map((h) => {
        const slot = byHour[h] ?? [];
        const timeLabel = `${String(h).padStart(2, "0")}:00`;

        return (
          <div key={h}>
            {slot.length === 0 ? (
              /* Empty slot */
              <div className="flex items-center gap-3 py-1.5 group">
                <span className="text-[11px] font-mono text-zinc-700 w-10 shrink-0 tabular-nums">
                  {timeLabel}
                </span>
                <div className="flex-1 h-6 border border-dashed border-[#1e1e1e] rounded-md group-hover:border-[#2a2a2a] transition-colors" />
              </div>
            ) : (
              /* Filled slot(s) */
              slot.map((rdv) => {
                const color = RDV_COLOR[rdv.type] ?? "#6b7280";
                return (
                  <div key={rdv.id} className="flex items-stretch gap-3 py-1">
                    <span className="text-[11px] font-mono text-zinc-400 w-10 shrink-0 tabular-nums pt-1.5">
                      {formatTime(rdv.dateHeure)}
                    </span>
                    <div
                      className="flex-1 rounded-lg px-3 py-2 flex items-center justify-between gap-2 min-w-0"
                      style={{
                        backgroundColor: `${color}12`,
                        borderLeft: `2px solid ${color}`,
                      }}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-200 truncate">
                          {rdv.client.prenom} {rdv.client.nom}
                        </p>
                        {rdv.client.telephone && (
                          <p className="text-[10px] text-zinc-600">{rdv.client.telephone}</p>
                        )}
                        {rdv.notes && (
                          <p className="text-[10px] text-zinc-600 truncate">{rdv.notes}</p>
                        )}
                      </div>
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ color, backgroundColor: `${color}20` }}
                      >
                        {RDV_TYPE_LABELS[rdv.type] ?? rdv.type}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main dashboard client ─────────────────────────────────────────────────────

export default function DashboardClient({ userName }: { userName: string }) {
  const [stats, setStats]         = useState<StatsData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [sortAsc, setSortAsc]     = useState(false);
  const [sparkData, setSparkData] = useState<number[]>([]);

  // Primary dashboard fetch (unchanged)
  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  // Secondary fetch: last 7 days daily ticket entries for sparklines
  useEffect(() => {
    const today = mtnToday();
    const d = new Date(today + "T12:00:00");
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const dd = new Date(d);
      dd.setDate(dd.getDate() - i);
      days.push(dd.toLocaleDateString("en-CA"));
    }
    fetch(`/api/admin/stats?from=${days[0]}&to=${days[days.length - 1]}`)
      .then((r) => r.json())
      .then((data) => {
        const map: Record<string, number> = Object.fromEntries(days.map((d) => [d, 0]));
        for (const t of data.tickets ?? []) {
          const day = new Date(t.dateEntree).toLocaleDateString("en-CA", {
            timeZone: "America/Martinique",
          });
          if (day in map) map[day]++;
        }
        setSparkData(days.map((d) => map[d]));
      })
      .catch(() => {});
  }, []);

  const dateStr = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long",
    timeZone: "America/Martinique",
  });

  const prenom = userName.split(/\s+/)[0] ?? userName;

  const activeTickets = stats?.ticketsByStatus
    .filter((s) => s.statut !== "LIVRE")
    .reduce((a, b) => a + b._count, 0) ?? 0;
  const pretTickets = stats?.ticketsByStatus.find((s) => s.statut === "PRET")?._count ?? 0;

  return (
    <div className="-mx-4 -mt-4 sm:-mx-6 sm:-mt-6 md:-mx-8 md:-mt-8 px-4 pt-6 pb-10 sm:px-6 sm:pt-6 sm:pb-10 md:px-8 md:pt-8 md:pb-10 min-h-screen bg-[#0a0a0a] animate-fadeIn">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-bold text-white tracking-tight">
          Bonjour {prenom}
          <span className="text-zinc-600 font-normal"> · </span>
          <span className="text-zinc-400 font-normal capitalize text-base">{dateStr}</span>
        </h1>
        <Link
          href="/admin/tickets"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ backgroundColor: "#F47920" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau ticket
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32 gap-3 text-zinc-600">
          <Spinner />
          <span className="text-sm">Chargement…</span>
        </div>
      ) : (
        <div className="space-y-5">

          {/* ── KPI cards ── */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <KpiCard
              label="Tickets total"
              value={stats?.totalTickets ?? 0}
              sub="Tous statuts"
              accentColor="#F47920"
              href="/admin/tickets"
              sparkData={sparkData}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    stroke="#F47920" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
            />
            <KpiCard
              label="En cours"
              value={activeTickets}
              sub="Tickets actifs"
              accentColor="#F59E0B"
              href="/admin/tickets"
              sparkData={sparkData}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="#F59E0B" strokeWidth="1.7"/>
                  <path d="M12 7v5l3 3" stroke="#F59E0B" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
              }
            />
            <KpiCard
              label="Prêts à récupérer"
              value={pretTickets}
              sub="À notifier"
              accentColor="#22C55E"
              href="/admin/tickets?status=PRET"
              sparkData={sparkData}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M4 12.5 9 17.5 20 6.5" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
            />
            <KpiCard
              label="RDV aujourd'hui"
              value={stats?.todayAppointments ?? 0}
              sub="Rendez-vous du jour"
              accentColor="#3B82F6"
              href="/admin/planning"
              sparkData={sparkData}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="5.5" width="16" height="14.5" rx="2.2" stroke="#3B82F6" strokeWidth="1.7"/>
                  <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" stroke="#3B82F6" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
              }
            />
          </div>

          {/* ── Pipeline kanban ── */}
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4 gap-3">
              <h2 className="text-sm font-semibold text-white">Pipeline des tickets</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSortAsc((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#161616] border border-[#2a2a2a] rounded-lg text-[11px] font-semibold text-zinc-400 hover:text-zinc-200 hover:border-[#3a3a3a] transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    {sortAsc ? (
                      <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    ) : (
                      <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    )}
                  </svg>
                  Ancienneté
                </button>
                <Link href="/admin/tickets" className="text-[11px] font-semibold text-[#F47920] hover:opacity-80 transition-opacity">
                  Voir tout →
                </Link>
              </div>
            </div>

            {/* Kanban: simple overflow-x-auto, no negative-margin clipping */}
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-3" style={{ minWidth: "max-content" }}>
                {STATUS_ORDER.map((statut) => {
                  const count = stats?.ticketsByStatus.find((x) => x.statut === statut)?._count ?? 0;
                  const tickets = stats?.recentTickets.filter((t) => t.statut === statut) ?? [];
                  return (
                    <KanbanColumn
                      key={statut}
                      statut={statut}
                      count={count}
                      tickets={tickets}
                      sortAsc={sortAsc}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Bottom: recent tickets + RDV time grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Tickets récents */}
            <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#1a1a1a]">
                <h2 className="text-sm font-semibold text-white">Tickets récents</h2>
                <Link href="/admin/tickets" className="text-[11px] font-semibold text-[#F47920] hover:opacity-80 transition-opacity">
                  Voir tout →
                </Link>
              </div>

              {(!stats?.recentTickets || stats.recentTickets.length === 0) ? (
                <p className="px-4 py-10 text-center text-sm text-zinc-700">Aucun ticket</p>
              ) : (
                <div className="divide-y divide-[#161616]">
                  {stats.recentTickets.map((ticket) => (
                    <Link
                      key={ticket.id}
                      href={`/admin/tickets/${ticket.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-[11px] font-mono font-bold text-[#F47920]">{ticket.numero}</span>
                          <StatusBadge statut={ticket.statut} />
                        </div>
                        <p className="text-sm font-medium text-zinc-300 truncate">
                          {ticket.marque} {ticket.modele}
                          <span className="text-zinc-600 font-normal"> — {ticket.client.prenom} {ticket.client.nom}</span>
                        </p>
                        <p className="text-[11px] text-zinc-700 mt-0.5">{formatDate(ticket.createdAt)}</p>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-zinc-700 group-hover:text-zinc-500 transition-colors">
                        <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Rendez-vous du jour — time grid */}
            <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#1a1a1a]">
                <h2 className="text-sm font-semibold text-white">Rendez-vous du jour</h2>
                <Link href="/admin/planning" className="text-[11px] font-semibold text-[#F47920] hover:opacity-80 transition-opacity">
                  Planning →
                </Link>
              </div>

              <div className="flex-1 px-4 py-3 overflow-y-auto" style={{ maxHeight: 420 }}>
                {(!stats?.todayRdvs || stats.todayRdvs.length === 0) ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#1a1a1a]">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <rect x="4" y="5.5" width="16" height="14.5" rx="2.2" stroke="#3B82F6" strokeWidth="1.7"/>
                        <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" stroke="#3B82F6" strokeWidth="1.7" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <p className="text-sm text-zinc-700">Aucun rendez-vous aujourd&apos;hui</p>
                  </div>
                ) : (
                  <TimeGrid rdvs={stats.todayRdvs} />
                )}
              </div>

              {/* "+ Planifier un RDV" always visible at bottom */}
              <div className="px-4 py-3 border-t border-[#1a1a1a]">
                <Link
                  href="/admin/planning"
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "#F47920" }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Planifier un RDV
                </Link>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
