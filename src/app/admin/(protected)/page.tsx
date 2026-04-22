"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDate, formatTime, RDV_TYPE_LABELS, RDV_TYPE_COLORS } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface StatsData {
  totalTickets: number;
  ticketsByStatus: { statut: string; _count: number }[];
  todayAppointments: number;
  recentTickets: {
    id: string;
    numero: string;
    materiel: string;
    marque: string;
    modele: string;
    statut: string;
    createdAt: string;
    client: { nom: string; prenom: string };
    technicien?: { nom: string } | null;
  }[];
  todayRdvs: {
    id: string;
    dateHeure: string;
    type: string;
    statut: string;
    notes?: string;
    client: { nom: string; prenom: string; telephone?: string };
  }[];
}

// ── Design tokens ──────────────────────────────────────────────────────────────

const ORANGE = "#F47920";
const INK  = "#0F0F12";
const INK2 = "#4A4A52";
const INK3 = "#8A8A92";
const LINE = "rgba(15,15,18,0.06)";
const CARD_SHADOW = "0 1px 2px rgba(15,15,18,0.04), 0 4px 16px rgba(15,15,18,0.06)";

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; fg: string; bg: string; dot: string }> = {
  RECU:           { label: "Reçu",           fg: "#184E8C", bg: "#E3EFFB", dot: "#2E7BD6" },
  DIAGNOSTIC:     { label: "Diagnostic",     fg: "#184E8C", bg: "#E3EFFB", dot: "#2E7BD6" },
  ATTENTE_PIECES: { label: "Attente pièces", fg: "#8E2B49", bg: "#FCE4EC", dot: "#D94A74" },
  EN_REPARATION:  { label: "En réparation",  fg: "#8A4A0A", bg: "#FCEBD4", dot: "#E08A1A" },
  PRET:           { label: "Prêt",           fg: "#0A6C43", bg: "#E6F5EC", dot: "#1AA86A" },
  LIVRE:          { label: "Livré",          fg: "#4A4A52", bg: "#F2F2F2", dot: "#8A8A92" },
};

const STATUS_ORDER = ["RECU", "DIAGNOSTIC", "ATTENTE_PIECES", "EN_REPARATION", "PRET", "LIVRE"];

// ── KPI card ──────────────────────────────────────────────────────────────────

interface KpiProps {
  label: string;
  value: number;
  sub: string;
  accentColor: string;
  iconBg: string;
  icon: React.ReactNode;
  href: string;
}

function KpiCard({ label, value, sub, accentColor, iconBg, icon, href }: KpiProps) {
  return (
    <Link
      href={href}
      className="block rounded-2xl p-5 border transition-all hover:shadow-md active:scale-[0.99] group"
      style={{ background: "#fff", borderColor: LINE, boxShadow: CARD_SHADOW }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-wide mb-2" style={{ color: INK3 }}>
            {label}
          </p>
          <p
            className="text-[36px] font-bold leading-none mb-1"
            style={{ color: INK, letterSpacing: "-1.5px", fontVariantNumeric: "tabular-nums" }}
          >
            {value}
          </p>
          <p className="text-[12px]" style={{ color: INK3 }}>{sub}</p>
        </div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
          style={{ background: iconBg }}
        >
          {icon}
        </div>
      </div>
      <div
        className="mt-4 pt-3 flex items-center justify-between text-[11.5px] font-semibold"
        style={{ borderTop: `1px solid ${LINE}`, color: accentColor }}
      >
        <span>Voir les détails</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="m9 6 6 6-6 6" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </Link>
  );
}

// ── Inline status badge ───────────────────────────────────────────────────────

function StatusPill({ statut }: { statut: string }) {
  const s = STATUS_CONFIG[statut];
  if (!s) return <span className="text-xs text-gray-400">{statut}</span>;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full text-[11px] font-bold whitespace-nowrap"
      style={{ padding: "3px 8px 3px 6px", background: s.bg, color: s.fg }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-sm" style={{ color: INK3 }}>
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Chargement...
        </div>
      </div>
    );
  }

  const activeTickets = stats?.ticketsByStatus
    .filter((s) => s.statut !== "LIVRE")
    .reduce((a, b) => a + b._count, 0) ?? 0;
  const pretTickets = stats?.ticketsByStatus.find((s) => s.statut === "PRET")?._count ?? 0;
  const dateStr = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="space-y-6 animate-fadeIn" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold leading-tight" style={{ color: INK, letterSpacing: "-0.5px" }}>
            Tableau de bord
          </h1>
          <p className="text-[13px] mt-0.5 capitalize" style={{ color: INK3 }}>{dateStr}</p>
        </div>
        <Link
          href="/admin/tickets"
          className="inline-flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          style={{ background: ORANGE }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau ticket
        </Link>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total tickets"
          value={stats?.totalTickets ?? 0}
          sub="Tous statuts confondus"
          accentColor={ORANGE}
          iconBg="#FFF1E6"
          href="/admin/tickets"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                stroke={ORANGE} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        />
        <KpiCard
          label="En cours"
          value={activeTickets}
          sub="Tickets actifs"
          accentColor="#E08A1A"
          iconBg="#FCEBD4"
          href="/admin/tickets"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#E08A1A" strokeWidth="1.7"/>
              <path d="M12 7v5l3 3" stroke="#E08A1A" strokeWidth="1.7" strokeLinecap="round"/>
            </svg>
          }
        />
        <KpiCard
          label="Prêts à récupérer"
          value={pretTickets}
          sub="À notifier les clients"
          accentColor="#1AA86A"
          iconBg="#E6F5EC"
          href="/admin/tickets?status=PRET"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 12.5 9 17.5 20 6.5" stroke="#1AA86A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        />
        <KpiCard
          label="RDV aujourd'hui"
          value={stats?.todayAppointments ?? 0}
          sub="Rendez-vous du jour"
          accentColor="#2E7BD6"
          iconBg="#E3EFFB"
          href="/admin/planning"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="5.5" width="16" height="14.5" rx="2.2" stroke="#2E7BD6" strokeWidth="1.7"/>
              <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" stroke="#2E7BD6" strokeWidth="1.7" strokeLinecap="round"/>
            </svg>
          }
        />
      </div>

      {/* ── Status pipeline ── */}
      <div className="rounded-2xl border p-4 sm:p-5" style={{ background: "#fff", borderColor: LINE, boxShadow: CARD_SHADOW }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold" style={{ color: INK }}>Pipeline des tickets</h2>
          <Link href="/admin/tickets" className="text-[12px] font-semibold" style={{ color: ORANGE }}>
            Voir tout →
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {STATUS_ORDER.map((statut) => {
            const s = STATUS_CONFIG[statut];
            const count = stats?.ticketsByStatus.find((x) => x.statut === statut)?._count ?? 0;
            return (
              <Link
                key={statut}
                href={`/admin/tickets?status=${statut}`}
                className="rounded-xl p-3 border-t-[3px] transition-all hover:shadow-sm active:scale-[0.98] flex flex-col gap-1.5"
                style={{ background: s.bg, borderTopColor: s.dot, borderLeft: "none", borderRight: "none", borderBottom: "none" }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: s.dot }} />
                <p
                  className="text-[26px] font-bold leading-none"
                  style={{ color: INK, letterSpacing: "-1px", fontVariantNumeric: "tabular-nums" }}
                >
                  {count}
                </p>
                <p className="text-[11px] font-semibold leading-tight" style={{ color: s.fg }}>{s.label}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Recent tickets + Today's appointments ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent tickets */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: "#fff", borderColor: LINE, boxShadow: CARD_SHADOW }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${LINE}` }}>
            <h2 className="text-[14px] font-semibold" style={{ color: INK }}>Tickets récents</h2>
            <Link href="/admin/tickets" className="text-[12px] font-semibold" style={{ color: ORANGE }}>
              Voir tout →
            </Link>
          </div>
          <div>
            {(!stats?.recentTickets || stats.recentTickets.length === 0) && (
              <p className="px-5 py-10 text-center text-[13px]" style={{ color: INK3 }}>Aucun ticket</p>
            )}
            {stats?.recentTickets.map((ticket, i) => (
              <Link
                key={ticket.id}
                href={`/admin/tickets/${ticket.id}`}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[#FAFAF7] group"
                style={{ borderTop: i > 0 ? `1px solid ${LINE}` : "none" }}
              >
                {/* ticket number + status */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span
                      className="text-[11px] font-bold"
                      style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", color: ORANGE }}
                    >
                      {ticket.numero}
                    </span>
                    <StatusPill statut={ticket.statut} />
                  </div>
                  <p className="text-[13px] font-semibold truncate" style={{ color: INK }}>
                    {ticket.marque} {ticket.modele}
                    <span className="font-normal" style={{ color: INK2 }}> — {ticket.client.prenom} {ticket.client.nom}</span>
                  </p>
                  <p className="text-[11.5px]" style={{ color: INK3 }}>{formatDate(ticket.createdAt)}</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 opacity-30 group-hover:opacity-60 transition-opacity">
                  <path d="m9 6 6 6-6 6" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            ))}
          </div>
        </div>

        {/* Today's appointments */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: "#fff", borderColor: LINE, boxShadow: CARD_SHADOW }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${LINE}` }}>
            <h2 className="text-[14px] font-semibold" style={{ color: INK }}>Rendez-vous du jour</h2>
            <Link href="/admin/planning" className="text-[12px] font-semibold" style={{ color: ORANGE }}>
              Planning →
            </Link>
          </div>
          <div>
            {(!stats?.todayRdvs || stats.todayRdvs.length === 0) && (
              <p className="px-5 py-10 text-center text-[13px]" style={{ color: INK3 }}>
                Aucun rendez-vous aujourd&apos;hui
              </p>
            )}
            {stats?.todayRdvs.map((rdv, i) => (
              <div
                key={rdv.id}
                className="flex items-start gap-4 px-5 py-3.5"
                style={{ borderTop: i > 0 ? `1px solid ${LINE}` : "none" }}
              >
                {/* time block */}
                <div
                  className="flex-shrink-0 w-14 text-center rounded-xl py-2"
                  style={{ background: "#FFF1E6" }}
                >
                  <p className="text-[15px] font-bold leading-none" style={{ color: ORANGE }}>
                    {formatTime(rdv.dateHeure)}
                  </p>
                </div>
                {/* details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-[13px] font-semibold" style={{ color: INK }}>
                      {rdv.client.prenom} {rdv.client.nom}
                    </p>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${RDV_TYPE_COLORS[rdv.type] || "bg-gray-100 text-gray-600 border-gray-200"}`}
                    >
                      {RDV_TYPE_LABELS[rdv.type] || rdv.type}
                    </span>
                  </div>
                  {rdv.client.telephone && (
                    <p className="text-[11.5px]" style={{ color: INK3 }}>{rdv.client.telephone}</p>
                  )}
                  {rdv.notes && (
                    <p className="text-[11.5px] truncate" style={{ color: INK2 }}>{rdv.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
