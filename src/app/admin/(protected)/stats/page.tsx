"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LabelList, AreaChart, Area,
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────

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
  evolution: ChartPoint[];
  tickets: TicketRow[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUT_LABELS: Record<string, string> = {
  RECU: "Reçu",
  DIAGNOSTIC: "En diagnostic",
  ATTENTE_PIECES: "Attente pièces",
  EN_REPARATION: "En réparation",
  PRET: "Prêt",
  LIVRE: "Livré",
};

const STATUT_COLORS: Record<string, string> = {
  RECU:          "#F47920",
  DIAGNOSTIC:    "#8B5CF6",
  ATTENTE_PIECES:"#6B7280",
  EN_REPARATION: "#3B82F6",
  PRET:          "#F59E0B",
  LIVRE:         "#10B981",
};
const BRAND_COLOR = "#F47920";

const CATEGORIES = [
  { value: "all",      label: "Toutes les stats" },
  { value: "entrees",  label: "Machines entrées" },
  { value: "reparees", label: "Machines réparées" },
  { value: "sorties",  label: "Machines sorties" },
  { value: "taux",     label: "Taux de réparation" },
  { value: "attente",  label: "Attente pièces" },
  { value: "rdv",      label: "RDV pris" },
  { value: "marque",   label: "Par marque" },
] as const;

type CatValue = typeof CATEGORIES[number]["value"];

interface CatConfig {
  kpis: string[];
  charts: Array<"parMois" | "parStatut" | "parMarque" | "evolution">;
  ticketFilter: (t: TicketRow) => boolean;
  showTickets: boolean;
}

const CAT_CONFIG: Record<CatValue, CatConfig> = {
  all:      { kpis: ["all"], charts: ["parMois", "parStatut", "parMarque", "evolution"], ticketFilter: () => true,                                         showTickets: true  },
  entrees:  { kpis: ["totalEntrees"],                                                    charts: ["parMois", "evolution"],                                  ticketFilter: () => true,                                                          showTickets: true  },
  reparees: { kpis: ["totalRepares", "tauxReparation", "delaiMoyen"],                   charts: ["parStatut"],                                             ticketFilter: (t) => t.statut === "LIVRE",                                         showTickets: true  },
  sorties:  { kpis: ["machinesSorties"],                                                 charts: ["parMois"],                                               ticketFilter: (t) => t.statut === "LIVRE" && t.dateLivraison !== null,            showTickets: true  },
  taux:     { kpis: ["totalEntrees", "totalRepares", "tauxReparation"],                 charts: ["parStatut"],                                             ticketFilter: () => true,                                                          showTickets: false },
  attente:  { kpis: ["enAttentePieces"],                                                 charts: [],                                                        ticketFilter: (t) => t.statut === "ATTENTE_PIECES",                               showTickets: true  },
  rdv:      { kpis: ["rdvPeriode"],                                                      charts: [],                                                        ticketFilter: () => false,                                                         showTickets: false },
  marque:   { kpis: ["totalEntrees"],                                                    charts: ["parMarque"],                                             ticketFilter: () => true,                                                          showTickets: true  },
};

// ── Date helpers ──────────────────────────────────────────────────────────────

function today()        { return new Date().toISOString().split("T")[0]; }
function mondayOfWeek() { const d = new Date(); const day = d.getDay() || 7; d.setDate(d.getDate() - day + 1); return d.toISOString().split("T")[0]; }
function firstOfMonth() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`; }
function firstOfYear()  { return `${new Date().getFullYear()}-01-01`; }

const PRESETS = [
  { label: "Cette semaine", from: mondayOfWeek, to: today },
  { label: "Ce mois",       from: firstOfMonth, to: today },
  { label: "Cette année",   from: firstOfYear,  to: today },
] as const;

// ── Small components ──────────────────────────────────────────────────────────

function KpiCard({ label, value, unit, sub }: { label: string; value: string | number; unit?: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">
        {value}<span className="text-lg font-medium text-gray-400 ml-1">{unit}</span>
      </p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}

// ── Ticket table ──────────────────────────────────────────────────────────────

function TicketTable({ tickets }: { tickets: TicketRow[] }) {
  if (tickets.length === 0) return <p className="text-sm text-gray-400 text-center py-6">Aucun ticket pour ce filtre.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {["N° Ticket","Client","Machine","Marque","Statut","Date entrée","Date livraison","Délai (j)"].map((h) => (
              <th key={h} className="text-left text-xs font-semibold text-gray-500 pb-2 pr-4 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.numero} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-2 pr-4 font-mono font-semibold text-xs" style={{ color: "#F47920" }}>{t.numero}</td>
              <td className="py-2 pr-4 whitespace-nowrap">{t.client}</td>
              <td className="py-2 pr-4">{t.materiel}</td>
              <td className="py-2 pr-4">{t.marque}</td>
              <td className="py-2 pr-4 whitespace-nowrap">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {STATUT_LABELS[t.statut] ?? t.statut}
                </span>
              </td>
              <td className="py-2 pr-4 whitespace-nowrap text-gray-500">{t.dateEntree ? new Date(t.dateEntree).toLocaleDateString("fr-FR") : "—"}</td>
              <td className="py-2 pr-4 whitespace-nowrap text-gray-500">{t.dateLivraison ? new Date(t.dateLivraison).toLocaleDateString("fr-FR") : "—"}</td>
              <td className="py-2 pr-4 text-gray-500">{t.delai != null ? t.delai : "—"}</td>
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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const [from, setFrom]               = useState(firstOfMonth());
  const [to,   setTo]                 = useState(today());
  const [data, setData]               = useState<StatsData | null>(null);
  const [loading, setLoading]         = useState(false);
  const [activePreset, setActivePreset] = useState<string>("Ce mois");
  const [activeCategory, setActiveCategory] = useState<CatValue>("all");
  const [exporting, setExporting]     = useState<"excel" | "pdf" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stats?from=${from}&to=${to}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  function applyPreset(label: string, fromFn: () => string, toFn: () => string) {
    setActivePreset(label);
    setFrom(fromFn());
    setTo(toFn());
  }

  // Derived values based on active category
  const config = CAT_CONFIG[activeCategory];
  const showKpi   = (key: string) => config.kpis.includes("all") || config.kpis.includes(key);
  const showChart = (key: "parMois" | "parStatut" | "parMarque" | "evolution") => config.charts.includes(key);
  const filteredTickets = data ? data.tickets.filter(config.ticketFilter) : [];
  const catLabel   = CATEGORIES.find((c) => c.value === activeCategory)?.label ?? "Statistiques";
  const exportTitle = activeCategory === "all"
    ? "Rapport statistiques complet"
    : `Bilan - ${catLabel}`;

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

  const hasCharts = config.charts.length > 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistiques</h1>
          <p className="text-gray-500 text-sm mt-0.5">Analyse des performances du SAV</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExcel} disabled={!data || exporting !== null}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
            {exporting === "excel" ? <Spinner /> : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            Exporter Excel
          </button>
          <button onClick={handlePdf} disabled={!data || exporting !== null}
            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
            {exporting === "pdf" ? <Spinner /> : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            )}
            Exporter PDF
          </button>
        </div>
      </div>

      {/* Date filter */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5 flex-wrap">
            {PRESETS.map((p) => (
              <button key={p.label} onClick={() => applyPreset(p.label, p.from, p.to)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activePreset === p.label ? "text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                style={activePreset === p.label ? { backgroundColor: "#F47920" } : {}}>
                {p.label}
              </button>
            ))}
            <button onClick={() => setActivePreset("custom")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activePreset === "custom" ? "text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              style={activePreset === "custom" ? { backgroundColor: "#F47920" } : {}}>
              Personnalisé
            </button>
          </div>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setActivePreset("custom"); }}
              className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-stihl-500" />
            <span className="text-gray-400 text-sm">→</span>
            <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setActivePreset("custom"); }}
              className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-stihl-500" />
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Filtrer par catégorie</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c.value} onClick={() => setActiveCategory(c.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                activeCategory === c.value
                  ? "text-white border-transparent"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
              style={activeCategory === c.value ? { backgroundColor: "#F47920" } : {}}>
              {c.label}
            </button>
          ))}
        </div>
        {activeCategory !== "all" && (
          <p className="text-xs text-gray-400 mt-3">
            Export : <span className="font-medium text-gray-600">{exportTitle} — {from} → {to}</span>
          </p>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-gray-400 gap-3">
          <Spinner /> Chargement...
        </div>
      )}

      {!loading && data && (
        <>
          {/* KPI cards */}
          {(() => {
            const cards = [
              showKpi("totalEntrees")    && <KpiCard key="e"  label="Machines entrées"    value={data.kpis.totalEntrees} />,
              showKpi("totalRepares")    && <KpiCard key="r"  label="Machines réparées"   value={data.kpis.totalRepares} />,
              showKpi("machinesSorties") && <KpiCard key="s"  label="Machines sorties"    value={data.kpis.machinesSorties} sub="Livré avec date de retrait" />,
              showKpi("tauxReparation")  && <KpiCard key="t"  label="Taux de réparation"  value={data.kpis.tauxReparation} unit="%" />,
              showKpi("delaiMoyen")      && <KpiCard key="d"  label="Délai moyen"         value={data.kpis.delaiMoyen} unit="j" sub="entre dépôt et livraison" />,
              showKpi("enAttentePieces") && <KpiCard key="a"  label="Attente pièces"      value={data.kpis.enAttentePieces} sub="en cours (toutes périodes)" />,
              showKpi("rdvPeriode")      && <KpiCard key="rv" label="RDV pris"            value={data.kpis.rdvPeriode} sub="sur la période" />,
            ].filter(Boolean);
            return cards.length > 0 ? (
              <div className={`grid gap-4 ${cards.length <= 3 ? "grid-cols-1 sm:grid-cols-3" : cards.length <= 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-" + cards.length}`}>
                {cards}
              </div>
            ) : null;
          })()}

          {/* Charts */}
          {hasCharts && (
            <>
              {(showChart("parMois") || showChart("parStatut")) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {showChart("parMois") && (
                    <Section title="Machines entrées par mois (12 derniers mois)">
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={data.parMois} margin={{ top: 22, right: 8, left: -24, bottom: 0 }} barCategoryGap="30%">
                          <defs>
                            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#F47920" stopOpacity={1} />
                              <stop offset="100%" stopColor="#FFB347" stopOpacity={1} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                          <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: "#d1d5db" }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }} />
                          <Bar dataKey="count" name="Entrées" fill="url(#barGrad)" radius={[6, 6, 0, 0]} isAnimationActive={true} animationDuration={800} animationEasing="ease-out">
                            <LabelList dataKey="count" position="top" style={{ fontSize: 10, fill: "#9ca3af", fontWeight: 500 }} formatter={(v: unknown) => (typeof v === "number" && v > 0) ? v : ""} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Section>
                  )}
                  {showChart("parStatut") && (
                    <Section title="Répartition par statut">
                      {data.parStatut.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-16">Aucune donnée</p>
                      ) : (() => {
                        const total = data.parStatut.reduce((s, d) => s + d.value, 0);
                        const ORDER = ["RECU","DIAGNOSTIC","ATTENTE_PIECES","EN_REPARATION","PRET","LIVRE"];
                        const sorted = ORDER
                          .map((key) => data.parStatut.find((d) => d.name === key))
                          .filter(Boolean) as { name: string; value: number }[];
                        return (
                          <div className="grid grid-cols-2 gap-3">
                            {sorted.map((d) => {
                              const color = STATUT_COLORS[d.name] ?? "#94a3b8";
                              const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                              return (
                                <div key={d.name} className="rounded-2xl shadow-md bg-white p-4 border-l-4 flex flex-col gap-2"
                                  style={{ borderLeftColor: color }}>
                                  <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                                    <span className="text-xs font-medium text-gray-500 truncate">{STATUT_LABELS[d.name] ?? d.name}</span>
                                  </div>
                                  <p className="text-3xl font-bold text-gray-900 leading-none">{d.value}</p>
                                  <div className="space-y-1">
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                                    </div>
                                    <p className="text-xs text-gray-400">{pct}%</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </Section>
                  )}
                </div>
              )}

              {(showChart("parMarque") || showChart("evolution")) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {showChart("parMarque") && (
                    <Section title="Répartition par marque">
                      {data.parMarque.filter((d) => d.value > 0).length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-16">Aucune donnée</p>
                      ) : (() => {
                        const brands = data.parMarque.filter((d) => d.value > 0);
                        const total = brands.reduce((s, d) => s + d.value, 0);
                        return (
                          <div className="space-y-3">
                            {brands.map((d) => {
                              const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                              return (
                                <div key={d.name} className="rounded-2xl shadow-md bg-white px-4 py-3 border-l-4 flex flex-col gap-2"
                                  style={{ borderLeftColor: "#F47920" }}>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-gray-800">{d.name}</span>
                                    <span className="text-2xl font-bold text-gray-900">{d.value}</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all"
                                      style={{ width: `${pct}%`, background: "linear-gradient(to right, #FFB347, #F47920)" }} />
                                  </div>
                                  <p className="text-xs text-gray-400">{pct}%</p>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </Section>
                  )}
                  {showChart("evolution") && (
                    <Section title="Évolution mensuelle (24 derniers mois)">
                      <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={data.evolution} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#F47920" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#F47920" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={3} />
                          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                          <Tooltip />
                          <Area type="monotone" dataKey="count" name="Entrées"
                            stroke={BRAND_COLOR} strokeWidth={3}
                            fill="url(#areaGrad)"
                            dot={{ r: 3, fill: BRAND_COLOR, strokeWidth: 0 }}
                            activeDot={{ r: 5 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Section>
                  )}
                </div>
              )}
            </>
          )}

          {/* Filtered ticket list */}
          {config.showTickets && (
            <Section title={`Liste des tickets — ${catLabel} (${filteredTickets.length})`}>
              <TicketTable tickets={filteredTickets} />
            </Section>
          )}
        </>
      )}
    </div>
  );
}
