"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LabelList, AreaChart, Area, LineChart, Line, Cell, Legend,
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TechInfo {
  id: string;
  prenom: string;
  nom: string;
  initiales: string;
  couleur: string;
}

interface TechRankRow extends TechInfo {
  tickets: number;
  repares: number;
  taux: number;
  delaiMoyen: number;
  lastActivity: string | null;
}

interface TechKpis {
  totalTickets: number;
  totalRepares: number;
  tauxGlobal: number;
  delaiGlobal: number;
}

interface TechData {
  technicians: TechInfo[];
  kpis: TechKpis;
  ranking: TechRankRow[];
  weeklyBars: Record<string, string | number | boolean>[];
  monthlyEvolution: Record<string, string | number>[];
}

interface Kpis {
  totalEntrees: number;
  totalRepares: number;
  machinesSorties: number;
  tauxReparation: number;
  delaiMoyen: number;
  enAttentePieces: number;
  rdvPeriode: number;
}

interface ChartPoint { month: string; count: number }
interface NameValue  { name: string; value: number }

interface TicketRow {
  numero: string;
  client: string;
  materiel: string;
  marque: string;
  statut: string;
  dateEntree: string;
  dateLivraison: string | null;
  delai: number | null;
}

interface StatsData {
  kpis: Kpis;
  parStatut: NameValue[];
  parMarque: NameValue[];
  parMois: ChartPoint[];
  parMoisSorties: ChartPoint[];
  parMoisTaux: ChartPoint[];
  evolution: ChartPoint[];
  tickets: TicketRow[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUT_LABELS: Record<string, string> = {
  RECU:           "Reçu",
  DIAGNOSTIC:     "En diagnostic",
  ATTENTE_PIECES: "Attente pièces",
  EN_REPARATION:  "En réparation",
  PRET:           "Prêt",
  LIVRE:          "Livré",
};

const STATUT_COLORS: Record<string, string> = {
  RECU:           "#F47920",
  DIAGNOSTIC:     "#8B5CF6",
  ATTENTE_PIECES: "#6B7280",
  EN_REPARATION:  "#3B82F6",
  PRET:           "#F59E0B",
  LIVRE:          "#10B981",
};

const BRAND_COLORS: Record<string, string> = {
  STIHL:     "#F47920",
  VIKING:    "#3b82f6",
  HONDA:     "#22c55e",
  HUSQVARNA: "#eab308",
  BUGNOT:    "#8b5cf6",
  GTS:       "#06b6d4",
  KIVA:      "#f43f5e",
  OREC:      "#a78bfa",
  RAPID:     "#34d399",
  AUTRE:     "#6b7280",
};

const getBrandColor = (name: string) =>
  BRAND_COLORS[name.toUpperCase()] ?? "#6b7280";

const CATEGORIES = [
  { value: "all",          label: "Toutes les stats" },
  { value: "entrees",      label: "Machines entrées" },
  { value: "reparees",     label: "Machines réparées" },
  { value: "sorties",      label: "Machines sorties" },
  { value: "taux",         label: "Taux de réparation" },
  { value: "attente",      label: "Attente pièces" },
  { value: "rdv",          label: "RDV pris" },
  { value: "marque",       label: "Par marque" },
  { value: "techniciens",  label: "Techniciens" },
] as const;

type CatValue = typeof CATEGORIES[number]["value"];

interface CatConfig {
  kpis: string[];
  charts: Array<"parMois" | "parStatut" | "parMarque" | "evolution">;
  ticketFilter: (t: TicketRow) => boolean;
  showTickets: boolean;
}

const CAT_CONFIG: Record<CatValue, CatConfig> = {
  all:         { kpis: ["all"], charts: ["parMois", "parStatut", "parMarque", "evolution"], ticketFilter: () => true,                                      showTickets: true  },
  entrees:     { kpis: ["totalEntrees"],                                                    charts: ["parMois", "evolution"],                               ticketFilter: () => true,                                                   showTickets: true  },
  reparees:    { kpis: ["totalRepares", "tauxReparation", "delaiMoyen"],                   charts: ["parMois", "parStatut"],                               ticketFilter: (t) => t.statut === "LIVRE",                                  showTickets: true  },
  sorties:     { kpis: ["machinesSorties"],                                                 charts: ["parMois"],                                            ticketFilter: (t) => t.statut === "LIVRE" && t.dateLivraison !== null,     showTickets: true  },
  taux:        { kpis: ["totalEntrees", "totalRepares", "tauxReparation"],                 charts: ["parMois", "parStatut"],                               ticketFilter: () => true,                                                   showTickets: false },
  attente:     { kpis: ["enAttentePieces"],                                                 charts: [],                                                     ticketFilter: (t) => t.statut === "ATTENTE_PIECES",                        showTickets: true  },
  rdv:         { kpis: ["rdvPeriode"],                                                      charts: [],                                                     ticketFilter: () => false,                                                  showTickets: false },
  marque:      { kpis: ["totalEntrees"],                                                    charts: ["parMarque"],                                          ticketFilter: () => true,                                                   showTickets: true  },
  techniciens: { kpis: [],                                                                  charts: [],                                                     ticketFilter: () => false,                                                  showTickets: false },
};

// ── Date helpers ──────────────────────────────────────────────────────────────

function today()        { return new Date().toLocaleDateString("en-CA", { timeZone: "America/Martinique" }); }
function mondayOfWeek() {
  const mtn = new Date().toLocaleDateString("en-CA", { timeZone: "America/Martinique" });
  const d = new Date(mtn + "T12:00:00");
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return d.toLocaleDateString("en-CA");
}
function firstOfMonth()   { return today().slice(0, 7) + "-01"; }
function firstOfQuarter() {
  const t = today();
  const month = parseInt(t.slice(5, 7));
  const qStart = Math.floor((month - 1) / 3) * 3 + 1;
  return t.slice(0, 5) + String(qStart).padStart(2, "0") + "-01";
}
function firstOfYear()    { return today().slice(0, 4) + "-01-01"; }

const PRESETS = [
  { label: "Cette semaine",  from: mondayOfWeek,   to: today },
  { label: "Ce mois",        from: firstOfMonth,   to: today },
  { label: "Ce trimestre",   from: firstOfQuarter, to: today },
  { label: "Cette année",    from: firstOfYear,    to: today },
] as const;

// ── Trend helper ──────────────────────────────────────────────────────────────

function computeTrend(series: ChartPoint[]): number | null {
  if (series.length < 2) return null;
  const cur  = series[series.length - 1].count;
  const prev = series[series.length - 2].count;
  if (prev === 0) return null;
  return Math.round(((cur - prev) / prev) * 100);
}

// ── Bar chart metadata per category ──────────────────────────────────────────

function getParMoisMeta(cat: CatValue, data: StatsData) {
  switch (cat) {
    case "sorties":
      return { title: "Machines sorties · 12 mois", chartData: data.parMoisSorties, name: "Sorties", unit: "" };
    case "reparees":
      return { title: "Machines réparées · 12 mois", chartData: data.parMoisSorties, name: "Réparées", unit: "" };
    case "taux":
      return { title: "Taux de réparation · 12 mois", chartData: data.parMoisTaux, name: "Taux", unit: "%" };
    default:
      return { title: "Machines entrées · 12 mois", chartData: data.parMois, name: "Entrées", unit: "" };
  }
}

// ── SparkLine ─────────────────────────────────────────────────────────────────

function SparkLine({ data, positive }: { data: number[]; positive: boolean }) {
  const points = data.map((count, i) => ({ i, count }));
  const color = positive ? "#F47920" : "#ef4444";
  return (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart data={points} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <Line
          type="monotone"
          dataKey="count"
          stroke={color}
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
  label, value, unit, sub, sparkData, trend, trendUnit = "%",
}: {
  label: string; value: string | number; unit?: string; sub?: string;
  sparkData?: number[]; trend?: number | null; trendUnit?: string;
}) {
  const isPositive = trend === null || trend === undefined || trend >= 0;
  return (
    <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider leading-tight">{label}</p>
        {trend !== null && trend !== undefined && (
          <span className={`shrink-0 text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
            isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
          }`}>
            {trend > 0 ? "+" : ""}{trend}{trendUnit}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white leading-none">
        {value}
        {unit && <span className="text-sm font-medium text-zinc-500 ml-1">{unit}</span>}
      </p>
      {sub && <p className="text-[11px] text-zinc-600 leading-tight">{sub}</p>}
      {sparkData && sparkData.length > 2 && (
        <SparkLine data={sparkData} positive={isPositive} />
      )}
    </div>
  );
}

// ── Dark section card ─────────────────────────────────────────────────────────

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-xs text-zinc-600 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}

// ── Status breakdown ──────────────────────────────────────────────────────────

function StatusBreakdown({ statuts }: { statuts: NameValue[] }) {
  const total = statuts.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <p className="text-sm text-zinc-600 text-center py-8">Aucune donnée</p>;

  const ORDER = ["RECU", "DIAGNOSTIC", "ATTENTE_PIECES", "EN_REPARATION", "PRET", "LIVRE"];
  const sorted = ORDER
    .map((key) => statuts.find((d) => d.name === key))
    .filter(Boolean) as NameValue[];

  return (
    <div className="space-y-3.5">
      {sorted.map((d) => {
        const color = STATUT_COLORS[d.name] ?? "#6b7280";
        const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
        return (
          <div key={d.name} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-sm text-zinc-400">{STATUT_LABELS[d.name] ?? d.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-white">{d.value}</span>
                <span className="text-xs text-zinc-600 w-8 text-right">{pct}%</span>
              </div>
            </div>
            <div className="w-full h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Brand breakdown GA4-style ─────────────────────────────────────────────────

function BrandBreakdown({ brands }: { brands: NameValue[] }) {
  const filtered = brands.filter((d) => d.value > 0);
  const total = filtered.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <p className="text-sm text-zinc-600 text-center py-8">Aucune donnée</p>;

  return (
    <div className="space-y-4">
      {filtered.map((d) => {
        const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
        const color = getBrandColor(d.name);
        return (
          <div key={d.name}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-sm font-medium text-zinc-300">{d.name}</span>
              </div>
              <span className="text-sm font-semibold text-white">{d.value}</span>
            </div>
            <div className="w-full h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
            <p className="text-[11px] text-zinc-600 mt-0.5">{pct}%</p>
          </div>
        );
      })}

      {/* Stacked bar */}
      <div className="pt-1">
        <div className="flex w-full h-2.5 rounded-full overflow-hidden">
          {filtered.map((d) => {
            const pct = total > 0 ? (d.value / total) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div
                key={d.name}
                title={`${d.name} – ${d.value} (${Math.round(pct)}%)`}
                style={{ width: `${pct}%`, backgroundColor: getBrandColor(d.name) }}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5">
          {filtered.map((d) => (
            <div key={d.name} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getBrandColor(d.name) }} />
              <span className="text-[11px] text-zinc-500">{d.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Ticket table (dark) ───────────────────────────────────────────────────────

function TicketTable({ tickets }: { tickets: TicketRow[] }) {
  if (tickets.length === 0) return (
    <p className="text-sm text-zinc-600 text-center py-8">Aucun ticket pour ce filtre.</p>
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1f1f1f]">
            {["N° Ticket","Client","Machine","Marque","Statut","Date entrée","Date livraison","Délai (j)"].map((h) => (
              <th key={h} className="text-left text-[11px] font-semibold text-zinc-600 pb-2.5 pr-4 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#161616]">
          {tickets.map((t) => (
            <tr key={t.numero} className="hover:bg-white/[0.02] transition-colors">
              <td className="py-2.5 pr-4 font-mono font-bold text-xs text-[#F47920]">{t.numero}</td>
              <td className="py-2.5 pr-4 whitespace-nowrap text-zinc-300">{t.client}</td>
              <td className="py-2.5 pr-4 text-zinc-400">{t.materiel}</td>
              <td className="py-2.5 pr-4 text-zinc-400">{t.marque}</td>
              <td className="py-2.5 pr-4 whitespace-nowrap">
                <span
                  className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                  style={{
                    backgroundColor: `${STATUT_COLORS[t.statut] ?? "#6b7280"}22`,
                    color: STATUT_COLORS[t.statut] ?? "#6b7280",
                  }}
                >
                  {STATUT_LABELS[t.statut] ?? t.statut}
                </span>
              </td>
              <td className="py-2.5 pr-4 whitespace-nowrap text-zinc-600 text-xs">
                {t.dateEntree ? new Date(t.dateEntree).toLocaleDateString("fr-FR") : "—"}
              </td>
              <td className="py-2.5 pr-4 whitespace-nowrap text-zinc-600 text-xs">
                {t.dateLivraison ? new Date(t.dateLivraison).toLocaleDateString("fr-FR") : "—"}
              </td>
              <td className="py-2.5 pr-4 text-zinc-600 text-xs">{t.delai != null ? t.delai : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Export helpers ────────────────────────────────────────────────────────────

async function exportExcel(tickets: TicketRow[], kpis: Kpis, from: string, to: string, title: string) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "SAV JardiPro";

  const kpiSheet = wb.addWorksheet("KPIs");
  kpiSheet.addRow([title]);
  kpiSheet.addRow(["Période", `${from} → ${to}`]);
  kpiSheet.addRow([]);
  kpiSheet.addRow(["Indicateur", "Valeur"]);
  kpiSheet.addRow(["Machines entrées",          kpis.totalEntrees]);
  kpiSheet.addRow(["Machines réparées",         kpis.totalRepares]);
  kpiSheet.addRow(["Machines sorties",          kpis.machinesSorties]);
  kpiSheet.addRow(["Taux de réparation",        `${kpis.tauxReparation} %`]);
  kpiSheet.addRow(["Délai moyen de réparation", `${kpis.delaiMoyen} jours`]);
  kpiSheet.addRow(["En attente pièces (actuel)",kpis.enAttentePieces]);
  kpiSheet.addRow(["RDV pris sur la période",   kpis.rdvPeriode]);

  const ws = wb.addWorksheet("Tickets");
  ws.columns = [
    { header: "N° Ticket",      key: "numero",        width: 16 },
    { header: "Client",         key: "client",        width: 24 },
    { header: "Machine",        key: "materiel",      width: 20 },
    { header: "Marque",         key: "marque",        width: 14 },
    { header: "Statut",         key: "statut",        width: 18 },
    { header: "Date entrée",    key: "dateEntree",    width: 16 },
    { header: "Date livraison", key: "dateLivraison", width: 16 },
    { header: "Délai (jours)",  key: "delai",         width: 14 },
  ];
  ws.getRow(1).font = { bold: true };
  for (const t of tickets) {
    ws.addRow({
      ...t,
      statut:        STATUT_LABELS[t.statut] ?? t.statut,
      dateEntree:    t.dateEntree    ? new Date(t.dateEntree).toLocaleDateString("fr-FR")    : "",
      dateLivraison: t.dateLivraison ? new Date(t.dateLivraison).toLocaleDateString("fr-FR") : "",
      delai:         t.delai ?? "",
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${from}-${to}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportPdf(tickets: TicketRow[], kpis: Kpis, from: string, to: string, title: string) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(16);
  doc.setTextColor(244, 121, 32);
  doc.text(`SAV JardiPro — ${title}`, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Période : ${from} → ${to}`, 14, 26);

  autoTable(doc, {
    startY: 32,
    head: [["Indicateur", "Valeur"]],
    body: [
      ["Machines entrées",           String(kpis.totalEntrees)],
      ["Machines réparées",          String(kpis.totalRepares)],
      ["Machines sorties",           String(kpis.machinesSorties)],
      ["Taux de réparation",         `${kpis.tauxReparation} %`],
      ["Délai moyen de réparation",  `${kpis.delaiMoyen} jours`],
      ["En attente pièces (actuel)", String(kpis.enAttentePieces)],
      ["RDV pris sur la période",    String(kpis.rdvPeriode)],
    ],
    theme: "striped",
    headStyles: { fillColor: [244, 121, 32] },
    margin: { left: 14, right: 14 },
    tableWidth: 100,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const afterKpis = (doc as any).lastAutoTable?.finalY ?? 80;
  autoTable(doc, {
    startY: afterKpis + 10,
    head: [["N° Ticket","Client","Machine","Marque","Statut","Date entrée","Date livraison","Délai (j)"]],
    body: tickets.map((t) => [
      t.numero, t.client, t.materiel, t.marque,
      STATUT_LABELS[t.statut] ?? t.statut,
      t.dateEntree    ? new Date(t.dateEntree).toLocaleDateString("fr-FR")    : "",
      t.dateLivraison ? new Date(t.dateLivraison).toLocaleDateString("fr-FR") : "—",
      t.delai != null ? String(t.delai) : "—",
    ]),
    theme: "striped",
    headStyles: { fillColor: [244, 121, 32] },
    styles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  doc.save(`${title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${from}-${to}.pdf`);
}

// ── Tooltip style ─────────────────────────────────────────────────────────────

const darkTooltip = {
  contentStyle: {
    backgroundColor: "#161616",
    border: "1px solid #2a2a2a",
    borderRadius: 8,
    boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
    fontSize: 12,
    color: "#ffffff",
  },
  labelStyle: { color: "#a1a1aa" },
  itemStyle: { color: "#ffffff" },
  cursor: { fill: "rgba(255,255,255,0.03)" },
};

// ── Tech ranking table ────────────────────────────────────────────────────────

function TechRankingTable({ ranking }: { ranking: TechRankRow[] }) {
  if (ranking.length === 0) return (
    <p className="text-sm text-zinc-600 text-center py-8">Aucune donnée</p>
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1f1f1f]">
            {["Technicien", "Tickets", "Réparés", "Taux", "Délai moy.", "Dernière activité"].map((h) => (
              <th key={h} className="text-left text-[11px] font-semibold text-zinc-600 pb-2.5 pr-4 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#161616]">
          {ranking.map((r) => (
            <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
              <td className="py-2.5 pr-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                    style={{ backgroundColor: r.couleur }}
                  >
                    {r.initiales}
                  </span>
                  <span className="text-zinc-300 text-xs">{r.prenom}</span>
                </div>
              </td>
              <td className="py-2.5 pr-4 text-zinc-400 text-xs">{r.tickets}</td>
              <td className="py-2.5 pr-4 text-zinc-300 font-semibold text-xs">{r.repares}</td>
              <td className="py-2.5 pr-4 text-xs">
                <span
                  className="px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    backgroundColor: r.taux >= 70 ? "#10B98122" : r.taux >= 40 ? "#F4792022" : "#ef444422",
                    color:           r.taux >= 70 ? "#10B981"   : r.taux >= 40 ? "#F47920"   : "#ef4444",
                  }}
                >
                  {r.taux}%
                </span>
              </td>
              <td className="py-2.5 pr-4 text-zinc-600 text-xs">{r.delaiMoyen > 0 ? `${r.delaiMoyen}j` : "—"}</td>
              <td className="py-2.5 pr-4 text-zinc-600 text-xs whitespace-nowrap">
                {r.lastActivity ? new Date(r.lastActivity).toLocaleDateString("fr-FR") : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TECH_BRANDS = ["STIHL", "OREC", "KIVA", "GTS", "BUGNOT", "RAPID", "VIKING"];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const [from, setFrom]                 = useState(firstOfMonth());
  const [to,   setTo]                   = useState(today());
  const [data, setData]                 = useState<StatsData | null>(null);
  const [loading, setLoading]           = useState(false);
  const [activePreset, setActivePreset] = useState<string>("Ce mois");
  const [activeCategory, setActiveCategory] = useState<CatValue>("all");
  const [exporting, setExporting]       = useState<"excel" | "pdf" | null>(null);

  // Techniciens tab state
  const [selectedTech,  setSelectedTech]  = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [techData,      setTechData]      = useState<TechData | null>(null);
  const [techLoading,   setTechLoading]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stats?from=${from}&to=${to}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  const loadTech = useCallback(async () => {
    setTechLoading(true);
    try {
      const params = new URLSearchParams({ from, to });
      if (selectedTech)  params.set("techId", selectedTech);
      if (selectedBrand) params.set("marque", selectedBrand);
      const res = await fetch(`/api/admin/stats/techniciens?${params}`);
      if (res.ok) setTechData(await res.json());
    } finally {
      setTechLoading(false);
    }
  }, [from, to, selectedTech, selectedBrand]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (activeCategory === "techniciens") loadTech();
  }, [activeCategory, loadTech]);

  function applyPreset(label: string, fromFn: () => string, toFn: () => string) {
    setActivePreset(label);
    setFrom(fromFn());
    setTo(toFn());
  }

  const config          = CAT_CONFIG[activeCategory];
  const showKpi         = (key: string) => config.kpis.includes("all") || config.kpis.includes(key);
  const showChart       = (key: "parMois" | "parStatut" | "parMarque" | "evolution") => config.charts.includes(key);
  const filteredTickets = data ? data.tickets.filter(config.ticketFilter) : [];
  const catLabel        = CATEGORIES.find((c) => c.value === activeCategory)?.label ?? "Statistiques";
  const exportTitle     = activeCategory === "all" ? "Rapport statistiques complet" : `Bilan - ${catLabel}`;

  async function handleExcel() {
    if (!data) return;
    setExporting("excel");
    try { await exportExcel(filteredTickets, data.kpis, from, to, exportTitle); }
    finally { setExporting(null); }
  }

  async function handlePdf() {
    if (!data) return;
    setExporting("pdf");
    try { await exportPdf(filteredTickets, data.kpis, from, to, exportTitle); }
    finally { setExporting(null); }
  }

  // Spark data (last 7 months)
  const sparkEntrees  = data ? data.parMois.slice(-7).map((d) => d.count) : [];
  const sparkSorties  = data ? data.parMoisSorties.slice(-7).map((d) => d.count) : [];
  const sparkTaux     = data ? data.parMoisTaux.slice(-7).map((d) => d.count) : [];

  // Trend vs previous month
  const trendEntrees  = data ? computeTrend(data.parMois)       : null;
  const trendSorties  = data ? computeTrend(data.parMoisSorties) : null;
  const trendTaux     = data ? computeTrend(data.parMoisTaux)    : null;

  const hasCharts = config.charts.length > 0;

  return (
    <div className="-mx-4 -mt-4 sm:-mx-6 sm:-mt-6 md:-mx-8 md:-mt-8 px-4 pt-6 pb-10 sm:px-6 sm:pt-6 sm:pb-10 md:px-8 md:pt-8 md:pb-10 min-h-screen bg-[#0a0a0a] animate-fadeIn">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Statistiques</h1>
          <p className="text-zinc-600 text-sm mt-0.5">Analyse des performances du SAV</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExcel}
            disabled={!data || exporting !== null}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#111111] border border-[#1f1f1f] text-zinc-300 rounded-lg text-sm font-medium hover:border-emerald-500/50 hover:text-emerald-400 disabled:opacity-40 transition-colors"
          >
            {exporting === "excel" ? <Spinner /> : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            Excel
          </button>
          <button
            onClick={handlePdf}
            disabled={!data || exporting !== null}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#111111] border border-[#1f1f1f] text-zinc-300 rounded-lg text-sm font-medium hover:border-red-500/50 hover:text-red-400 disabled:opacity-40 transition-colors"
          >
            {exporting === "pdf" ? <Spinner /> : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            )}
            PDF
          </button>
        </div>
      </div>

      {/* ── Date filter ── */}
      <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl px-4 py-3 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 flex-wrap">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p.label, p.from, p.to)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activePreset === p.label
                    ? "text-white"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                }`}
                style={activePreset === p.label ? { backgroundColor: "#F47920" } : {}}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => setActivePreset("custom")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activePreset === "custom"
                  ? "text-white"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
              }`}
              style={activePreset === "custom" ? { backgroundColor: "#F47920" } : {}}
            >
              Personnalisé
            </button>
          </div>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <input
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setActivePreset("custom"); }}
              className="px-2.5 py-1.5 bg-[#161616] border border-[#2a2a2a] text-zinc-300 rounded-lg text-sm focus:outline-none focus:border-[#F47920]/50 transition-colors [color-scheme:dark]"
            />
            <span className="text-zinc-700 text-sm">→</span>
            <input
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); setActivePreset("custom"); }}
              className="px-2.5 py-1.5 bg-[#161616] border border-[#2a2a2a] text-zinc-300 rounded-lg text-sm focus:outline-none focus:border-[#F47920]/50 transition-colors [color-scheme:dark]"
            />
          </div>
        </div>
      </div>

      {/* ── Category tabs ── */}
      <div className="overflow-x-auto mb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8">
        <div className="flex gap-1 min-w-max">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setActiveCategory(c.value)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeCategory === c.value
                  ? "text-white shadow-lg"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
              }`}
              style={activeCategory === c.value ? { backgroundColor: "#F47920" } : {}}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading ── */}
      {(activeCategory === "techniciens" ? techLoading : loading) && (
        <div className="flex items-center justify-center py-24 text-zinc-700 gap-3">
          <Spinner /> <span className="text-sm">Chargement…</span>
        </div>
      )}

      {/* ── Techniciens tab — error/empty fallback ── */}
      {activeCategory === "techniciens" && !techLoading && !techData && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-600">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm">Impossible de charger les données techniciens.</p>
          <button
            onClick={loadTech}
            className="px-3 py-1.5 bg-[#111111] border border-[#1f1f1f] text-zinc-400 rounded-lg text-sm hover:border-[#F47920]/50 hover:text-[#F47920] transition-colors"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* ── Techniciens tab ── */}
      {activeCategory === "techniciens" && !techLoading && techData && (
        <div className="space-y-4">

          {/* Tech + brand selectors */}
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-1 flex-wrap">
                <button
                  onClick={() => setSelectedTech(null)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedTech === null ? "text-white" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                  }`}
                  style={selectedTech === null ? { backgroundColor: "#F47920" } : {}}
                >
                  Tous
                </button>
                {techData.technicians.map((tech) => (
                  <button
                    key={tech.id}
                    onClick={() => setSelectedTech(tech.id === selectedTech ? null : tech.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedTech === tech.id ? "text-white" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                    }`}
                    style={selectedTech === tech.id ? { backgroundColor: tech.couleur } : {}}
                  >
                    {tech.initiales} — {tech.prenom}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 flex-wrap ml-auto">
                <button
                  onClick={() => setSelectedBrand(null)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    selectedBrand === null ? "text-white" : "text-zinc-600 hover:text-zinc-400 hover:bg-white/5"
                  }`}
                  style={selectedBrand === null ? { backgroundColor: "#333" } : {}}
                >
                  Toutes marques
                </button>
                {TECH_BRANDS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedBrand(m === selectedBrand ? null : m)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      selectedBrand === m ? "text-white" : "text-zinc-600 hover:text-zinc-400 hover:bg-white/5"
                    }`}
                    style={selectedBrand === m ? { backgroundColor: getBrandColor(m) } : {}}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard label="Tickets traités"    value={techData.kpis.totalTickets} />
            <KpiCard label="Machines réparées"  value={techData.kpis.totalRepares} />
            <KpiCard label="Taux de réparation" value={techData.kpis.tauxGlobal}  unit="%" />
            <KpiCard label="Délai moyen"         value={techData.kpis.delaiGlobal} unit="j" sub="entre dépôt et livraison" />
          </div>

          {/* Weekly bars + ranking */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Section title="Machines réparées par semaine" subtitle="Semaines de la période sélectionnée">
                {techData.weeklyBars.length === 0 ? (
                  <p className="text-sm text-zinc-600 text-center py-8">Aucune donnée sur cette période</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      data={techData.weeklyBars}
                      margin={{ top: 16, right: 4, left: -28, bottom: 0 }}
                      barCategoryGap="20%"
                      barGap={2}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                      <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip {...darkTooltip} />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 11, color: "#71717a", paddingTop: 8 }}
                      />
                      {techData.technicians.map((tech) => (
                        <Bar
                          key={tech.id}
                          dataKey={tech.initiales}
                          name={tech.prenom}
                          radius={[3, 3, 0, 0]}
                          isAnimationActive
                          animationDuration={600}
                        >
                          {techData.weeklyBars.map((entry, i) => (
                            <Cell
                              key={`cell-${i}`}
                              fill={entry.isCurrent ? tech.couleur : `${tech.couleur}55`}
                            />
                          ))}
                        </Bar>
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Section>
            </div>

            <Section title="Classement" subtitle="Sur la période">
              <TechRankingTable ranking={techData.ranking} />
            </Section>
          </div>

          {/* Monthly evolution */}
          <Section title="Évolution mensuelle" subtitle="Machines réparées · 12 derniers mois">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={techData.monthlyEvolution}
                margin={{ top: 16, right: 4, left: -28, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "#a1a1aa" }}
                  axisLine={false}
                  tickLine={false}
                  interval={1}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#71717a" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip {...darkTooltip} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, color: "#71717a", paddingTop: 8 }}
                />
                {techData.technicians.map((tech) => (
                  <Line
                    key={tech.id}
                    type="monotone"
                    dataKey={tech.initiales}
                    name={tech.prenom}
                    stroke={tech.couleur}
                    strokeWidth={2}
                    dot={{ r: 3, fill: tech.couleur, stroke: "#0a0a0a", strokeWidth: 2 }}
                    activeDot={{ r: 5, fill: tech.couleur, stroke: "#0a0a0a", strokeWidth: 2 }}
                    isAnimationActive
                    animationDuration={800}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}

      {activeCategory !== "techniciens" && !loading && data && (
        <div className="space-y-4">

          {/* ── KPI cards grid ── */}
          {(() => {
            const cards = [
              showKpi("totalEntrees")    && (
                <KpiCard key="e"  label="Machines entrées"   value={data.kpis.totalEntrees}
                  sparkData={sparkEntrees} trend={trendEntrees} />
              ),
              showKpi("totalRepares")    && (
                <KpiCard key="r"  label="Machines réparées"  value={data.kpis.totalRepares}
                  sparkData={sparkSorties} trend={trendSorties} />
              ),
              showKpi("machinesSorties") && (
                <KpiCard key="s"  label="Machines sorties"   value={data.kpis.machinesSorties}
                  sparkData={sparkSorties} trend={trendSorties} sub="Livré avec date de retrait" />
              ),
              showKpi("tauxReparation")  && (
                <KpiCard key="t"  label="Taux de réparation" value={data.kpis.tauxReparation}
                  unit="%" sparkData={sparkTaux} trend={trendTaux} trendUnit="pts" />
              ),
              showKpi("delaiMoyen")      && (
                <KpiCard key="d"  label="Délai moyen"        value={data.kpis.delaiMoyen}
                  unit="j" sub="entre dépôt et livraison" />
              ),
              showKpi("enAttentePieces") && (
                <KpiCard key="a"  label="Attente pièces"     value={data.kpis.enAttentePieces}
                  sub="en cours (toutes périodes)" />
              ),
              showKpi("rdvPeriode")      && (
                <KpiCard key="rv" label="RDV pris"           value={data.kpis.rdvPeriode}
                  sub="sur la période" />
              ),
            ].filter(Boolean);

            if (cards.length === 0) return null;
            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {cards}
              </div>
            );
          })()}

          {/* ── Bar chart + Status breakdown ── */}
          {(showChart("parMois") || showChart("parStatut")) && (() => {
            const meta = getParMoisMeta(activeCategory, data);
            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {showChart("parMois") && (
                  <div className={showChart("parStatut") ? "lg:col-span-2" : "lg:col-span-3"}>
                    <Section title={meta.title}>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart
                          data={meta.chartData}
                          margin={{ top: 16, right: 4, left: -28, bottom: 0 }}
                          barCategoryGap="28%"
                        >
                          <defs>
                            <linearGradient id="barGradDark" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#F47920" stopOpacity={1} />
                              <stop offset="100%" stopColor="#d4660e" stopOpacity={1} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                          <XAxis
                            dataKey="month"
                            tick={{ fontSize: 10, fill: "#a1a1aa" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 10, fill: "#71717a" }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                          />
                          <Tooltip
                            {...darkTooltip}
                            formatter={(v: unknown) => [`${v}${meta.unit}`, meta.name]}
                          />
                          <Bar
                            dataKey="count"
                            name={meta.name}
                            radius={[4, 4, 0, 0]}
                            isAnimationActive
                            animationDuration={700}
                            animationEasing="ease-out"
                          >
                            {meta.chartData.map((_, i) => (
                              <Cell
                                key={`cell-${i}`}
                                fill={i === meta.chartData.length - 1 ? "url(#barGradDark)" : "#1e1e1e"}
                                stroke={i === meta.chartData.length - 1 ? "none" : "#2a2a2a"}
                                strokeWidth={1}
                              />
                            ))}
                            <LabelList
                              dataKey="count"
                              position="top"
                              style={{ fontSize: 9, fill: "#71717a", fontWeight: 500 }}
                              formatter={(v: unknown) => (typeof v === "number" && v > 0) ? `${v}${meta.unit}` : ""}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Section>
                  </div>
                )}

                {showChart("parStatut") && (
                  <Section title="Par statut">
                    <StatusBreakdown statuts={data.parStatut} />
                  </Section>
                )}
              </div>
            );
          })()}

          {/* ── Brand + Evolution ── */}
          {(showChart("parMarque") || showChart("evolution")) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {showChart("parMarque") && (
                <Section title="Par marque">
                  <BrandBreakdown brands={data.parMarque} />
                </Section>
              )}
              {showChart("evolution") && (
                <Section title="Évolution mensuelle" subtitle="24 derniers mois">
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={data.evolution} margin={{ top: 16, right: 4, left: -28, bottom: 0 }}>
                      <defs>
                        <linearGradient id="areaGradDark" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="#F47920" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#F47920" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 10, fill: "#a1a1aa" }}
                        axisLine={false}
                        tickLine={false}
                        interval={3}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#71717a" }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        {...darkTooltip}
                        cursor={{ stroke: "#F47920", strokeWidth: 1, strokeDasharray: "4 4" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        name="Entrées"
                        stroke="#F47920"
                        strokeWidth={2}
                        fill="url(#areaGradDark)"
                        dot={{ r: 3, fill: "#F47920", stroke: "#0a0a0a", strokeWidth: 2 }}
                        activeDot={{ r: 5, fill: "#F47920", stroke: "#0a0a0a", strokeWidth: 2 }}
                        isAnimationActive
                        animationDuration={900}
                        animationEasing="ease-out"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Section>
              )}
            </div>
          )}

          {/* ── Ticket list ── */}
          {config.showTickets && (
            <Section title={`Liste des tickets — ${catLabel}`} subtitle={`${filteredTickets.length} ticket${filteredTickets.length > 1 ? "s" : ""}`}>
              <TicketTable tickets={filteredTickets} />
            </Section>
          )}
        </div>
      )}
    </div>
  );
}
