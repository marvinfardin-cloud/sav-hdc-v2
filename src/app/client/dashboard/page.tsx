"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TicketWizard } from "./TicketWizard";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Ticket {
  id: string;
  numero: string;
  materiel: string;
  marque: string;
  modele: string;
  statut: string;
  dateDepot: string;
  dateEstimee?: string;
  notesPubliques?: string;
  historique: { id: string; statut: string; note?: string; createdAt: string }[];
  technicien?: { nom: string } | null;
}

// ── Design tokens ──────────────────────────────────────────────────────────────

const ORANGE = "#F47920";
const ORANGE_DARK = "#D9621A";
const INK = "#0F0F12";
const INK2 = "#4A4A52";
const INK3 = "#8A8A92";
const LINE = "rgba(15,15,18,0.06)";
const CARD_SHADOW = "0 1px 2px rgba(15,15,18,0.04), 0 4px 16px rgba(15,15,18,0.06)";

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; fg: string; bg: string; dot: string; stage: number }> = {
  RECU:           { label: "Reçu",             fg: "#184E8C", bg: "#E3EFFB", dot: "#2E7BD6", stage: 0 },
  DIAGNOSTIC:     { label: "Diagnostic",       fg: "#184E8C", bg: "#E3EFFB", dot: "#2E7BD6", stage: 1 },
  ATTENTE_PIECES: { label: "Attente pièce",    fg: "#8E2B49", bg: "#FCE4EC", dot: "#D94A74", stage: 2 },
  EN_REPARATION:  { label: "En réparation",    fg: "#8A4A0A", bg: "#FCEBD4", dot: "#E08A1A", stage: 2 },
  PRET:           { label: "Prêt à récupérer", fg: "#0A6C43", bg: "#E6F5EC", dot: "#1AA86A", stage: 3 },
  LIVRE:          { label: "Livré",            fg: "#4A4A52", bg: "#F2F2F2", dot: "#8A8A92", stage: 4 },
};

const STAGES = ["Dépôt", "Diagnostic", "Réparation", "Contrôle", "Prêt"];

// ── Small components ───────────────────────────────────────────────────────────

function WelcomeCard({ firstName, enCours, pret }: { firstName: string; enCours: number; pret: number }) {
  const initials = firstName.slice(0, 2).toUpperCase();
  return (
    <div className="rounded-2xl p-4 border" style={{ background: "#fff", borderColor: LINE, boxShadow: CARD_SHADOW }}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"
                stroke={ORANGE} strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            <span className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: ORANGE }}>
              Les Hauts de Californie
            </span>
          </div>
          <div className="text-[22px] font-bold leading-tight" style={{ color: INK, letterSpacing: "-0.5px" }}>
            Bonjour {firstName}
          </div>
          <div className="mt-1 text-[13.5px] leading-snug" style={{ color: INK2 }}>
            {pret > 0 ? (
              <>
                <span className="font-semibold" style={{ color: INK }}>{pret} machine{pret > 1 ? "s" : ""} prête{pret > 1 ? "s" : ""}</span> à récupérer
                {enCours > 0 && <> et <span className="font-semibold" style={{ color: INK }}>{enCours} réparation{enCours > 1 ? "s" : ""}</span> en cours.</>}
              </>
            ) : enCours > 0 ? (
              <><span className="font-semibold" style={{ color: INK }}>{enCours} réparation{enCours > 1 ? "s" : ""}</span> en cours.</>
            ) : (
              "Aucune réparation en cours pour le moment."
            )}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[12px]" style={{ color: INK3 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M12 21s-6-5.5-6-11a6 6 0 1 1 12 0c0 5.5-6 11-6 11Z" stroke={INK3} strokeWidth="1.6"/>
              <circle cx="12" cy="10" r="2.2" stroke={INK3} strokeWidth="1.6"/>
            </svg>
            <span>SAV Les Hauts de Californie · 7h–12h et 13h–16h</span>
          </div>
        </div>
        <div
          className="w-11 h-11 rounded-[14px] flex items-center justify-center text-white font-bold text-[15px] flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE_DARK})`,
            boxShadow: "0 4px 12px rgba(244,121,32,0.35)",
            letterSpacing: "0.3px",
          }}
        >
          {initials}
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, trend, dotColor, icon, onClick }: {
  label: string; value: number; trend: string;
  dotColor: string; icon: React.ReactNode; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-[18px] border p-[14px] flex flex-col gap-2.5 w-full transition-transform active:scale-[0.98]"
      style={{ background: "#fff", borderColor: LINE, boxShadow: CARD_SHADOW }}
    >
      <div className="flex items-center justify-between">
        <div
          className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center"
          style={{ background: dotColor, boxShadow: `0 4px 10px ${dotColor}40` }}
        >
          {icon}
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="m9 6 6 6-6 6" stroke={INK3} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div>
        <div className="text-[30px] font-bold leading-none" style={{ color: INK, letterSpacing: "-1px", fontVariantNumeric: "tabular-nums" }}>
          {value}
        </div>
        <div className="mt-1 text-[13px] font-semibold" style={{ color: INK }}>{label}</div>
        <div className="mt-0.5 text-[11.5px]" style={{ color: INK3 }}>{trend}</div>
      </div>
    </button>
  );
}

function ActionBar({ onSubmit }: { onSubmit: () => void }) {
  const btnStyle: React.CSSProperties = {
    background: `linear-gradient(180deg, ${ORANGE} 0%, ${ORANGE_DARK} 100%)`,
    borderRadius: 16, padding: "14px", color: "#fff", textAlign: "left",
    display: "flex", flexDirection: "column", gap: 10,
    boxShadow: "0 1px 2px rgba(217,98,26,0.4), 0 8px 20px rgba(244,121,32,0.28), inset 0 1px 0 rgba(255,255,255,0.25)",
    cursor: "pointer", border: "none", position: "relative", overflow: "hidden", width: "100%",
  };
  const sheen: React.CSSProperties = {
    position: "absolute", inset: 0,
    background: "radial-gradient(120% 80% at 100% 0%, rgba(255,255,255,0.25), transparent 55%)",
    pointerEvents: "none",
  };
  const iconWrap: React.CSSProperties = {
    width: 34, height: 34, borderRadius: 10,
    background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.28)",
    display: "grid", placeItems: "center", position: "relative",
  };
  return (
    <button onClick={onSubmit} style={btnStyle}>
      <div style={sheen} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
        <div style={iconWrap}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <div className="text-[14px] font-bold leading-tight" style={{ letterSpacing: "-0.2px" }}>Soumettre une demande de réparation</div>
          <div className="text-[11.5px] mt-0.5" style={{ opacity: 0.85 }}>Nouvelle panne · choisir un créneau de dépôt</div>
        </div>
      </div>
    </button>
  );
}

function SectionHeader({ count, filter, onFilter }: { count: number; filter: string; onFilter: (f: string) => void }) {
  const chips = [
    { id: "all", label: "Tous" },
    { id: "inprogress", label: "En cours" },
    { id: "ready", label: "Prêts" },
  ];
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2.5">
        <span className="text-[16px] font-bold" style={{ color: INK, letterSpacing: "-0.2px" }}>Mes réparations</span>
        <span className="text-[13px]" style={{ color: INK3 }}>{count}</span>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {chips.map((c) => {
          const active = filter === c.id;
          return (
            <button
              key={c.id}
              onClick={() => onFilter(c.id)}
              className="text-[12.5px] font-semibold px-3 py-1.5 rounded-full transition-colors"
              style={{
                border: `1px solid ${active ? INK : LINE}`,
                background: active ? INK : "#fff",
                color: active ? "#fff" : INK2,
                cursor: "pointer",
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProgressTrack({ stage, color }: { stage: number; color: string }) {
  const pct = (stage / (STAGES.length - 1)) * 100;
  return (
    <div>
      <div style={{ height: 6, background: "#F2F2EE", borderRadius: 99, overflow: "hidden", position: "relative" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width .5s ease" }} />
        {STAGES.map((_, i) =>
          i > 0 && i < STAGES.length - 1 ? (
            <div key={i} style={{
              position: "absolute", top: 0,
              left: `${(i / (STAGES.length - 1)) * 100}%`,
              width: 2, height: "100%", background: "rgba(255,255,255,0.9)",
              transform: "translateX(-1px)",
            }} />
          ) : null
        )}
      </div>
      <div className="flex justify-between mt-1.5">
        {STAGES.map((label, i) => (
          <div
            key={label}
            className="text-[9.5px] font-semibold uppercase flex-1 leading-tight"
            style={{
              letterSpacing: "0.3px",
              color: i <= stage ? INK : INK3,
              textAlign: i === 0 ? "left" : i === STAGES.length - 1 ? "right" : "center",
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function TicketCard({ ticket }: { ticket: Ticket }) {
  const [expanded, setExpanded] = useState(false);
  const s = STATUS_CONFIG[ticket.statut] ?? STATUS_CONFIG.RECU;
  const days = Math.floor((Date.now() - new Date(ticket.dateDepot).getTime()) / 86400000);
  const note = ticket.notesPubliques || ticket.historique[ticket.historique.length - 1]?.note || "";

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: `1px solid ${LINE}`, boxShadow: CARD_SHADOW }}>
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left p-4 pb-3">
        {/* header */}
        <div className="flex items-center gap-2.5 mb-3">
          {/* machine glyph */}
          <div
            className="w-11 h-11 rounded-[13px] flex items-center justify-center flex-shrink-0"
            style={{ background: s.bg, border: `1px solid ${s.dot}22` }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 16h16l-1.5-5H5.5L4 16Z" stroke={s.fg} strokeWidth="1.6" strokeLinejoin="round"/>
              <circle cx="8" cy="18.5" r="2" stroke={s.fg} strokeWidth="1.6"/>
              <circle cx="16" cy="18.5" r="2" stroke={s.fg} strokeWidth="1.6"/>
              <path d="M9 11V7.5A2.5 2.5 0 0 1 11.5 5h1A2.5 2.5 0 0 1 15 7.5V11" stroke={s.fg} strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: INK3, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
              {ticket.numero}
            </div>
            <div className="text-[15px] font-bold leading-tight truncate" style={{ color: INK, letterSpacing: "-0.2px" }}>
              {ticket.materiel}
            </div>
            <div className="text-[12.5px] mt-0.5" style={{ color: INK2 }}>{ticket.marque} {ticket.modele}</div>
          </div>
          {/* status badge */}
          <div
            className="inline-flex items-center gap-1.5 rounded-full text-[11px] font-bold whitespace-nowrap flex-shrink-0"
            style={{ padding: "5px 9px 5px 7px", background: s.bg, color: s.fg }}
          >
            <span className="w-[6px] h-[6px] rounded-full" style={{ background: s.dot, boxShadow: `0 0 0 3px ${s.dot}22` }} />
            {s.label}
          </div>
        </div>

        {/* progress */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <div className="text-[11.5px]" style={{ color: INK3 }}>
              Déposée il y a <span className="font-semibold" style={{ color: INK }}>{days} jour{days !== 1 ? "s" : ""}</span>
            </div>
            <div className="text-[11.5px]" style={{ color: INK3 }}>
              Étape <span className="font-semibold" style={{ color: INK }}>{s.stage + 1}</span> / {STAGES.length}
            </div>
          </div>
          <ProgressTrack stage={s.stage} color={s.dot} />
        </div>
      </button>

      {/* footer note */}
      {(note || ticket.statut === "PRET") && (
        <div className="px-4 pb-3.5 flex items-center gap-2.5" style={{ borderTop: `1px dashed ${LINE}`, paddingTop: 10, marginTop: 2 }}>
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
          <span className="text-[12.5px] flex-1 leading-snug" style={{ color: INK2 }}>
            {note || "Machine prête — prenez rendez-vous pour le retrait."}
          </span>
          {ticket.statut === "PRET" && (
            <Link
              href="/client/rdv"
              onClick={(e) => e.stopPropagation()}
              className="text-[12px] font-bold text-white rounded-[10px] px-3 py-2 flex-shrink-0"
              style={{ background: ORANGE, boxShadow: "0 2px 6px rgba(244,121,32,0.35)" }}
            >
              Retirer
            </Link>
          )}
        </div>
      )}

      {/* expanded historique */}
      {expanded && ticket.historique.length > 0 && (
        <div className="px-4 pb-4 pt-3 space-y-2" style={{ borderTop: `1px solid ${LINE}` }}>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: INK3 }}>Historique</p>
          {ticket.historique.map((h) => {
            const hs = STATUS_CONFIG[h.statut];
            return (
              <div key={h.id} className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: hs?.dot ?? "#ccc" }} />
                <div>
                  <p className="text-[12px] font-semibold" style={{ color: INK }}>{hs?.label ?? h.statut}</p>
                  {h.note && <p className="text-[11.5px]" style={{ color: INK2 }}>{h.note}</p>}
                  <p className="text-[10.5px]" style={{ color: INK3 }}>
                    {new Date(h.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ClientDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/tickets").then((r) => r.json()),
      fetch("/api/client/me").then((r) => r.json()),
    ]).then(([ticketData, meData]) => {
      setTickets(Array.isArray(ticketData) ? ticketData : []);
      setFirstName(meData?.prenom ?? "");
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const inProgress = tickets.filter((t) => ["RECU", "DIAGNOSTIC", "EN_REPARATION", "ATTENTE_PIECES"].includes(t.statut));
  const ready = tickets.filter((t) => t.statut === "PRET");

  const filtered = tickets.filter((t) => {
    if (filter === "inprogress") return ["RECU", "DIAGNOSTIC", "EN_REPARATION", "ATTENTE_PIECES"].includes(t.statut);
    if (filter === "ready") return t.statut === "PRET";
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-2" style={{ color: INK3 }}>
        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <WelcomeCard firstName={firstName} enCours={inProgress.length} pret={ready.length} />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <KPICard
          label="En cours"
          value={inProgress.length}
          trend={inProgress.length > 0 ? `${inProgress.length} active${inProgress.length > 1 ? "s" : ""}` : "Aucune en cours"}
          dotColor="#E08A1A"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M14.7 6.3a4 4 0 0 1 5 5L17 14l3 3-3 3-3-3-2.7 2.7a4 4 0 0 1-5-5L9 12 6 9 9 6l3 3 2.7-2.7Z" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round"/>
            </svg>
          }
          onClick={() => setFilter(filter === "inprogress" ? "all" : "inprogress")}
        />
        <KPICard
          label="Prêt à récupérer"
          value={ready.length}
          trend={ready.length > 0 ? "En attente de retrait" : "Aucune prête"}
          dotColor="#1AA86A"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 12.5 9 17.5 20 6.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
          onClick={() => setFilter(filter === "ready" ? "all" : "ready")}
        />
      </div>

      <ActionBar onSubmit={() => setShowModal(true)} />

      {tickets.length > 0 && (
        <>
          <SectionHeader count={filtered.length} filter={filter} onFilter={setFilter} />
          <div className="space-y-2.5">
            {filtered.map((t) => <TicketCard key={t.id} ticket={t} />)}
            {filtered.length === 0 && (
              <div className="p-8 text-center rounded-2xl text-sm"
                style={{ background: "#fff", border: `1px dashed ${LINE}`, color: INK3 }}>
                Aucune réparation dans cette catégorie.
              </div>
            )}
          </div>
        </>
      )}

      {tickets.length === 0 && (
        <div className="rounded-2xl p-10 text-center"
          style={{ background: "#fff", border: `1px dashed ${LINE}`, boxShadow: CARD_SHADOW }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "#F2F2EE" }}>
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                stroke="#8A8A92" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-[15px] font-semibold mb-1" style={{ color: INK }}>Aucun ticket pour l&apos;instant</p>
          <p className="text-sm mb-5" style={{ color: INK3 }}>Soumettez votre première demande de réparation.</p>
          <button onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
            style={{ background: ORANGE }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Soumettre une demande
          </button>
        </div>
      )}

      {showModal && (
        <TicketWizard onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); loadData(); }} />
      )}
    </div>
  );
}
