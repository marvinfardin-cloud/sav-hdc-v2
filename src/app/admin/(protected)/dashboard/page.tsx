"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDate, formatTime, RDV_TYPE_LABELS } from "@/lib/utils";

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

const ORANGE      = "#F47920";
const INK         = "#0F0F12";
const INK2        = "#4A4A52";
const INK3        = "#8A8A92";
const SURFACE     = "#FFFFFF";
const DIVIDER     = "rgba(15,15,18,0.07)";
const SHADOW_SM   = "0 1px 3px rgba(15,15,18,0.06), 0 4px 20px rgba(15,15,18,0.05)";
const SHADOW_CARD = "0 2px 8px rgba(15,15,18,0.04), 0 12px 40px rgba(15,15,18,0.06)";

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; fg: string; bg: string; accent: string }> = {
  RECU:           { label: "Reçu",           fg: "#1D5FAD", bg: "#EBF4FD", accent: "#2E7BD6" },
  DIAGNOSTIC:     { label: "Diagnostic",     fg: "#1D5FAD", bg: "#EBF4FD", accent: "#2E7BD6" },
  ATTENTE_PIECES: { label: "Attente pièces", fg: "#9B2550", bg: "#FDE9EF", accent: "#D94A74" },
  EN_REPARATION:  { label: "En réparation",  fg: "#8C4A0A", bg: "#FEF0E2", accent: "#E08A1A" },
  PRET:           { label: "Prêt",           fg: "#0C6E42", bg: "#E8F8F0", accent: "#1AA86A" },
  LIVRE:          { label: "Livré",          fg: "#52525A", bg: "#F4F4F5", accent: "#A1A1AA" },
};

const STATUS_ORDER = ["RECU", "DIAGNOSTIC", "ATTENTE_PIECES", "EN_REPARATION", "PRET", "LIVRE"];

// ── Tiny helpers ───────────────────────────────────────────────────────────────

function Pill({ statut }: { statut: string }) {
  const s = STATUS_CFG[statut];
  if (!s) return <span className="text-xs" style={{ color: INK3 }}>{statut}</span>;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full text-[11px] font-bold leading-none whitespace-nowrap"
      style={{ padding: "3px 9px 3px 7px", background: s.bg, color: s.fg }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.accent }} />
      {s.label}
    </span>
  );
}

function SectionHeader({ title, linkLabel, linkHref }: { title: string; linkLabel: string; linkHref: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-[15px] font-semibold tracking-tight" style={{ color: INK }}>{title}</h2>
      <Link
        href={linkHref}
        className="text-[12px] font-semibold flex items-center gap-1 transition-opacity hover:opacity-70"
        style={{ color: ORANGE }}
      >
        {linkLabel}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="m9 6 6 6-6 6" stroke={ORANGE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminDashboardV2() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  const activeTickets = stats?.ticketsByStatus
    .filter((s) => s.statut !== "LIVRE")
    .reduce((a, b) => a + b._count, 0) ?? 0;
  const pretTickets = stats?.ticketsByStatus.find((s) => s.statut === "PRET")?._count ?? 0;
  const dateStr = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long",
  });

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-[60vh]"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: `${ORANGE} transparent transparent transparent` }}
          />
          <p className="text-sm" style={{ color: INK3 }}>Chargement…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="space-y-7"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >

      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: ORANGE }}>
            Tableau de bord
          </p>
          <h1
            className="text-[28px] sm:text-[32px] font-bold leading-none capitalize"
            style={{ color: INK, letterSpacing: "-1px" }}
          >
            {dateStr}
          </h1>
        </div>
        <Link
          href="/admin/tickets"
          className="inline-flex items-center gap-2 text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98] whitespace-nowrap"
          style={{ background: ORANGE, boxShadow: SHADOW_SM }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau ticket
        </Link>
      </div>

      {/* ── KPI row ─────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">

        {/* Total tickets */}
        <Link
          href="/admin/tickets"
          className="group rounded-2xl p-5 sm:p-6 flex flex-col gap-3 transition-all hover:-translate-y-0.5 active:scale-[0.99]"
          style={{ background: SURFACE, boxShadow: SHADOW_CARD }}
        >
          <div className="flex items-center justify-between">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "#FFF1E6" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  stroke={ORANGE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="opacity-20 group-hover:opacity-50 transition-opacity">
              <path d="m9 6 6 6-6 6" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p
              className="text-[34px] sm:text-[40px] font-extrabold leading-none"
              style={{ color: INK, letterSpacing: "-2px", fontVariantNumeric: "tabular-nums" }}
            >
              {stats?.totalTickets ?? 0}
            </p>
            <p className="text-[12px] font-medium mt-1.5" style={{ color: INK3 }}>Total tickets</p>
          </div>
          <div className="h-0.5 w-8 rounded-full" style={{ background: ORANGE }} />
        </Link>

        {/* En cours */}
        <Link
          href="/admin/tickets"
          className="group rounded-2xl p-5 sm:p-6 flex flex-col gap-3 transition-all hover:-translate-y-0.5 active:scale-[0.99]"
          style={{ background: SURFACE, boxShadow: SHADOW_CARD }}
        >
          <div className="flex items-center justify-between">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "#FEF0E2" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#E08A1A" strokeWidth="1.8" />
                <path d="M12 7v5l3 3" stroke="#E08A1A" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="opacity-20 group-hover:opacity-50 transition-opacity">
              <path d="m9 6 6 6-6 6" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p
              className="text-[34px] sm:text-[40px] font-extrabold leading-none"
              style={{ color: INK, letterSpacing: "-2px", fontVariantNumeric: "tabular-nums" }}
            >
              {activeTickets}
            </p>
            <p className="text-[12px] font-medium mt-1.5" style={{ color: INK3 }}>En cours</p>
          </div>
          <div className="h-0.5 w-8 rounded-full" style={{ background: "#E08A1A" }} />
        </Link>

        {/* Prêts */}
        <Link
          href="/admin/tickets?status=PRET"
          className="group rounded-2xl p-5 sm:p-6 flex flex-col gap-3 transition-all hover:-translate-y-0.5 active:scale-[0.99]"
          style={{ background: SURFACE, boxShadow: SHADOW_CARD }}
        >
          <div className="flex items-center justify-between">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "#E8F8F0" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 12.5 9 17.5 20 6.5" stroke="#1AA86A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="opacity-20 group-hover:opacity-50 transition-opacity">
              <path d="m9 6 6 6-6 6" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p
              className="text-[34px] sm:text-[40px] font-extrabold leading-none"
              style={{ color: INK, letterSpacing: "-2px", fontVariantNumeric: "tabular-nums" }}
            >
              {pretTickets}
            </p>
            <p className="text-[12px] font-medium mt-1.5" style={{ color: INK3 }}>Prêts à récupérer</p>
          </div>
          <div className="h-0.5 w-8 rounded-full" style={{ background: "#1AA86A" }} />
        </Link>

        {/* RDV */}
        <Link
          href="/admin/planning"
          className="group rounded-2xl p-5 sm:p-6 flex flex-col gap-3 transition-all hover:-translate-y-0.5 active:scale-[0.99]"
          style={{ background: SURFACE, boxShadow: SHADOW_CARD }}
        >
          <div className="flex items-center justify-between">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "#EBF4FD" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="5.5" width="16" height="14.5" rx="2.2" stroke="#2E7BD6" strokeWidth="1.8" />
                <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" stroke="#2E7BD6" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="opacity-20 group-hover:opacity-50 transition-opacity">
              <path d="m9 6 6 6-6 6" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p
              className="text-[34px] sm:text-[40px] font-extrabold leading-none"
              style={{ color: INK, letterSpacing: "-2px", fontVariantNumeric: "tabular-nums" }}
            >
              {stats?.todayAppointments ?? 0}
            </p>
            <p className="text-[12px] font-medium mt-1.5" style={{ color: INK3 }}>RDV aujourd&apos;hui</p>
          </div>
          <div className="h-0.5 w-8 rounded-full" style={{ background: "#2E7BD6" }} />
        </Link>

      </div>

      {/* ── Status pipeline ─────────────────────────────────────────────────────── */}
      <div
        className="rounded-3xl p-5 sm:p-6"
        style={{ background: SURFACE, boxShadow: SHADOW_CARD }}
      >
        <SectionHeader title="Pipeline des tickets" linkLabel="Tous les tickets" linkHref="/admin/tickets" />
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
          {STATUS_ORDER.map((statut) => {
            const s = STATUS_CFG[statut];
            const count = stats?.ticketsByStatus.find((x) => x.statut === statut)?._count ?? 0;
            return (
              <Link
                key={statut}
                href={`/admin/tickets?status=${statut}`}
                className="group rounded-2xl p-3.5 sm:p-4 flex flex-col gap-2 transition-all hover:scale-[1.03] active:scale-[0.98]"
                style={{ background: s.bg }}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.accent }} />
                <p
                  className="text-[28px] sm:text-[32px] font-extrabold leading-none"
                  style={{ color: INK, letterSpacing: "-1px", fontVariantNumeric: "tabular-nums" }}
                >
                  {count}
                </p>
                <p className="text-[10px] sm:text-[11px] font-bold leading-tight" style={{ color: s.fg }}>
                  {s.label}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Bottom row ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Recent tickets — 3 cols */}
        <div
          className="lg:col-span-3 rounded-3xl overflow-hidden"
          style={{ background: SURFACE, boxShadow: SHADOW_CARD }}
        >
          <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4">
            <SectionHeader title="Tickets récents" linkLabel="Voir tout" linkHref="/admin/tickets" />
          </div>

          {(!stats?.recentTickets || stats.recentTickets.length === 0) && (
            <p className="px-6 pb-8 text-center text-[13px]" style={{ color: INK3 }}>
              Aucun ticket
            </p>
          )}

          {stats?.recentTickets.map((ticket, i) => (
            <Link
              key={ticket.id}
              href={`/admin/tickets/${ticket.id}`}
              className="group flex items-center gap-3 px-5 sm:px-6 py-3.5 transition-colors hover:bg-[#FAFAF8]"
              style={{ borderTop: `1px solid ${DIVIDER}` }}
            >
              {/* colored bar */}
              <div
                className="w-1 self-stretch rounded-full flex-shrink-0"
                style={{ background: STATUS_CFG[ticket.statut]?.accent ?? INK3, minHeight: 36 }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span
                    className="text-[11px] font-bold tracking-wide"
                    style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace", color: ORANGE }}
                  >
                    {ticket.numero}
                  </span>
                  <Pill statut={ticket.statut} />
                </div>
                <p className="text-[13px] font-semibold leading-snug truncate" style={{ color: INK }}>
                  {ticket.marque} {ticket.modele}
                  <span className="font-normal" style={{ color: INK2 }}>
                    {" "}· {ticket.client.prenom} {ticket.client.nom}
                  </span>
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: INK3 }}>{formatDate(ticket.createdAt)}</p>
              </div>
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                className="flex-shrink-0 opacity-0 group-hover:opacity-40 transition-opacity"
              >
                <path d="m9 6 6 6-6 6" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ))}
        </div>

        {/* Today's appointments — 2 cols */}
        <div
          className="lg:col-span-2 rounded-3xl overflow-hidden"
          style={{ background: SURFACE, boxShadow: SHADOW_CARD }}
        >
          <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4">
            <SectionHeader title="Rendez-vous du jour" linkLabel="Planning" linkHref="/admin/planning" />
          </div>

          {(!stats?.todayRdvs || stats.todayRdvs.length === 0) && (
            <div className="px-6 pb-10 flex flex-col items-center gap-2 text-center">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-1"
                style={{ background: "#EBF4FD" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="5.5" width="16" height="14.5" rx="2.2" stroke="#2E7BD6" strokeWidth="1.8" />
                  <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" stroke="#2E7BD6" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-[13px] font-medium" style={{ color: INK3 }}>
                Aucun rendez-vous aujourd&apos;hui
              </p>
            </div>
          )}

          {stats?.todayRdvs.map((rdv, i) => (
            <div
              key={rdv.id}
              className="flex items-start gap-3 sm:gap-4 px-5 sm:px-6 py-4"
              style={{ borderTop: `1px solid ${DIVIDER}` }}
            >
              {/* time chip */}
              <div
                className="flex-shrink-0 rounded-xl px-2.5 py-2 text-center min-w-[52px]"
                style={{ background: "#FFF1E6" }}
              >
                <p
                  className="text-[14px] font-extrabold leading-none"
                  style={{ color: ORANGE, letterSpacing: "-0.5px" }}
                >
                  {formatTime(rdv.dateHeure)}
                </p>
              </div>
              {/* info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="text-[13px] font-semibold" style={{ color: INK }}>
                    {rdv.client.prenom} {rdv.client.nom}
                  </p>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "#FFF1E6", color: ORANGE }}
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
  );
}
