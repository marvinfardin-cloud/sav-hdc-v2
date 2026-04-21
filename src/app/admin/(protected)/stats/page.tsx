"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from "recharts";

// ── Types ────────────────────────────────────────────────────────────────────

interface Kpis {
  totalEntrees: number;
  totalRepares: number;
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

// ── Constants ────────────────────────────────────────────────────────────────

const STATUT_LABELS: Record<string, string> = {
  RECU: "Reçu",
  DIAGNOSTIC: "En diagnostic",
  ATTENTE_PIECES: "Attente pièces",
  EN_REPARATION: "En réparation",
  PRET: "Prêt",
  LIVRE: "Livré",
};

const PIE_COLORS = ["#6366f1", "#f59e0b", "#F47920", "#8b5cf6", "#22c55e", "#94a3b8"];

const BRAND_COLOR = "#F47920";

// ── Date helpers ─────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function mondayOfWeek(): string {
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return d.toISOString().split("T")[0];
}

function firstOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function firstOfYear(): string {
  return `${new Date().getFullYear()}-01-01`;
}

const PRESETS = [
  { label: "Cette semaine", from: mondayOfWeek, to: today },
  { label: "Ce mois",       from: firstOfMonth, to: today },
  { label: "Cette année",   from: firstOfYear,  to: today },
] as const;

// ── KPI card ─────────────────────────────────────────────────────────────────

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

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      {children}
    </div>
  );
}

// ── Export helpers (client-side) ──────────────────────────────────────────────

async function exportExcel(tickets: TicketRow[], kpis: Kpis, from: string, to: string) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "SAV JardiPro";

  // KPI sheet
  const kpiSheet = wb.addWorksheet("KPIs");
  kpiSheet.addRow(["Indicateur", "Valeur"]);
  kpiSheet.addRow(["Période", `${from} → ${to}`]);
  kpiSheet.addRow(["Machines entrées", kpis.totalEntrees]);
  kpiSheet.addRow(["Machines réparées", kpis.totalRepares]);
  kpiSheet.addRow(["Taux de réparation", `${kpis.tauxReparation} %`]);
  kpiSheet.addRow(["Délai moyen de réparation", `${kpis.delaiMoyen} jours`]);
  kpiSheet.addRow(["En attente pièces (actuel)", kpis.enAttentePieces]);
  kpiSheet.addRow(["RDV pris sur la période", kpis.rdvPeriode]);

  // Tickets sheet
  const ws = wb.addWorksheet("Tickets");
  ws.columns = [
    { header: "N° Ticket",       key: "numero",        width: 16 },
    { header: "Client",          key: "client",        width: 24 },
    { header: "Machine",         key: "materiel",      width: 20 },
    { header: "Marque",          key: "marque",        width: 14 },
    { header: "Statut",          key: "statut",        width: 18 },
    { header: "Date entrée",     key: "dateEntree",    width: 16 },
    { header: "Date livraison",  key: "dateLivraison", width: 16 },
    { header: "Délai (jours)",   key: "delai",         width: 14 },
  ];
  ws.getRow(1).font = { bold: true };

  for (const t of tickets) {
    ws.addRow({
      ...t,
      statut: STATUT_LABELS[t.statut] ?? t.statut,
      dateEntree:    t.dateEntree    ? new Date(t.dateEntree).toLocaleDateString("fr-FR")    : "",
      dateLivraison: t.dateLivraison ? new Date(t.dateLivraison).toLocaleDateString("fr-FR") : "",
      delai: t.delai ?? "",
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `stats-sav-${from}-${to}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportPdf(tickets: TicketRow[], kpis: Kpis, from: string, to: string) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape" });

  // Header
  doc.setFontSize(16);
  doc.setTextColor(244, 121, 32);
  doc.text("SAV JardiPro — Rapport statistiques", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Période : ${from} → ${to}`, 14, 26);

  // KPI summary
  autoTable(doc, {
    startY: 32,
    head: [["Indicateur", "Valeur"]],
    body: [
      ["Machines entrées",             String(kpis.totalEntrees)],
      ["Machines réparées",            String(kpis.totalRepares)],
      ["Taux de réparation",           `${kpis.tauxReparation} %`],
      ["Délai moyen de réparation",    `${kpis.delaiMoyen} jours`],
      ["En attente pièces (actuel)",   String(kpis.enAttentePieces)],
      ["RDV pris sur la période",      String(kpis.rdvPeriode)],
    ],
    theme: "striped",
    headStyles: { fillColor: [244, 121, 32] },
    margin: { left: 14, right: 14 },
    tableWidth: 100,
  });

  // Ticket list
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const afterKpis = (doc as any).lastAutoTable?.finalY ?? 80;
  autoTable(doc, {
    startY: afterKpis + 10,
    head: [["N° Ticket", "Client", "Machine", "Marque", "Statut", "Date entrée", "Date livraison", "Délai (j)"]],
    body: tickets.map((t) => [
      t.numero,
      t.client,
      t.materiel,
      t.marque,
      STATUT_LABELS[t.statut] ?? t.statut,
      t.dateEntree    ? new Date(t.dateEntree).toLocaleDateString("fr-FR")    : "",
      t.dateLivraison ? new Date(t.dateLivraison).toLocaleDateString("fr-FR") : "-",
      t.delai != null ? String(t.delai) : "-",
    ]),
    theme: "striped",
    headStyles: { fillColor: [244, 121, 32] },
    styles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  doc.save(`stats-sav-${from}-${to}.pdf`);
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const [from, setFrom] = useState(firstOfMonth());
  const [to,   setTo]   = useState(today());
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activePreset, setActivePreset] = useState<string>("Ce mois");
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);

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

  async function handleExcel() {
    if (!data) return;
    setExporting("excel");
    try { await exportExcel(data.tickets, data.kpis, from, to); }
    finally { setExporting(null); }
  }

  async function handlePdf() {
    if (!data) return;
    setExporting("pdf");
    try { await exportPdf(data.tickets, data.kpis, from, to); }
    finally { setExporting(null); }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistiques</h1>
          <p className="text-gray-500 text-sm mt-0.5">Analyse des performances du SAV</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExcel}
            disabled={!data || exporting !== null}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {exporting === "excel" ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            Exporter Excel
          </button>
          <button
            onClick={handlePdf}
            disabled={!data || exporting !== null}
            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {exporting === "pdf" ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
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
              <button
                key={p.label}
                onClick={() => applyPreset(p.label, p.from, p.to)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activePreset === p.label
                    ? "text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
              className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-stihl-500"
            />
            <span className="text-gray-400 text-sm">→</span>
            <input
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); setActivePreset("custom"); }}
              className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-stihl-500"
            />
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-gray-400 gap-3">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Chargement...
        </div>
      )}

      {!loading && data && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
            <KpiCard label="Machines entrées"       value={data.kpis.totalEntrees} />
            <KpiCard label="Machines réparées"      value={data.kpis.totalRepares} />
            <KpiCard label="Taux de réparation"     value={data.kpis.tauxReparation} unit="%" />
            <KpiCard label="Délai moyen"            value={data.kpis.delaiMoyen} unit="j" sub="entre dépôt et livraison" />
            <KpiCard label="Attente pièces"         value={data.kpis.enAttentePieces} sub="en cours (toutes périodes)" />
            <KpiCard label="RDV pris"               value={data.kpis.rdvPeriode} sub="sur la période" />
          </div>

          {/* Charts row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Section title="Machines entrées par mois (12 derniers mois)">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.parMois} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Entrées" fill={BRAND_COLOR} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Section>

            <Section title="Répartition par statut">
              {data.parStatut.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-16">Aucune donnée</p>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={data.parStatut.map((d) => ({ ...d, name: STATUT_LABELS[d.name] ?? d.name }))}
                      cx="50%"
                      cy="45%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`}
                      labelLine={true}
                    >
                      {data.parStatut.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                    <Legend
                      formatter={(value) => <span style={{ fontSize: 11 }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Section>
          </div>

          {/* Charts row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Section title="Répartition par marque">
              {data.parMarque.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-16">Aucune donnée</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={data.parMarque}
                    layout="vertical"
                    margin={{ top: 4, right: 20, left: 40, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                    <Tooltip />
                    <Bar dataKey="value" name="Tickets" fill={BRAND_COLOR} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Section>

            <Section title="Évolution mensuelle (24 derniers mois)">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.evolution} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10 }}
                    interval={3}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Entrées"
                    stroke={BRAND_COLOR}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Section>
          </div>
        </>
      )}
    </div>
  );
}
