"use client";

import { useEffect, useState, useCallback } from "react";

interface LatestTicket {
  numero: string;
  materiel: string;
  marque: string;
  modele: string;
}

interface Rdv {
  id: string;
  dateHeure: string;
  type: string;
  statut: string;
  notes?: string;
  client: {
    nom: string;
    prenom: string;
    telephone?: string;
    tickets: LatestTicket[];
  };
}

const RDV_CONFIG: Record<string, { label: string; bg: string; border: string; badge: string; dot: string }> = {
  depot: {
    label: "Dépôt",
    bg: "bg-blue-50/60",
    border: "border-l-blue-400",
    badge: "bg-blue-100 text-blue-800",
    dot: "bg-blue-500",
  },
  retrait: {
    label: "Retrait",
    bg: "bg-green-50/60",
    border: "border-l-green-400",
    badge: "bg-green-100 text-green-800",
    dot: "bg-green-500",
  },
  diagnostic: {
    label: "Diagnostic",
    bg: "bg-orange-50/60",
    border: "border-l-orange-400",
    badge: "bg-orange-100 text-orange-800",
    dot: "bg-orange-500",
  },
};

const MORNING_SLOTS = [7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5];
const AFTERNOON_SLOTS = [13, 13.5, 14, 14.5, 15, 15.5];

function decimalToTimeStr(decimal: number): string {
  const h = Math.floor(decimal);
  const m = (decimal % 1) * 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Get the Martinique date string "YYYY-MM-DD" for a given JS Date
function toMQDateStr(date: Date): string {
  const mq = new Date(date.getTime() - 4 * 60 * 60 * 1000);
  return mq.toISOString().split("T")[0];
}

// Get the Martinique time as a decimal (e.g. 8.5 = 08:30) from a stored UTC dateHeure
function getMQDecimalTime(dateHeure: string): number {
  const d = new Date(dateHeure);
  const mqH = ((d.getUTCHours() - 4) + 24) % 24;
  const mqM = d.getUTCMinutes();
  return mqH + mqM / 60;
}

const DAYS_FULL_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const MONTHS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

export default function PlanningPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [rdvs, setRdvs] = useState<Rdv[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRdvs = useCallback(async () => {
    setLoading(true);
    const dateStr = toMQDateStr(currentDate);
    try {
      const res = await fetch(`/api/admin/rdv?view=day&date=${dateStr}`);
      const data = await res.json();
      setRdvs(data.rdvs || []);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => { fetchRdvs(); }, [fetchRdvs]);

  const navigate = (dir: -1 | 1) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  };

  const isToday = toMQDateStr(currentDate) === toMQDateStr(new Date());

  // Format display date in Martinique timezone
  const mqDate = new Date(currentDate.getTime() - 4 * 60 * 60 * 1000);
  const mqDayOfWeek = mqDate.getUTCDay();
  const mqDay = mqDate.getUTCDate();
  const mqMonth = MONTHS_FR[mqDate.getUTCMonth()];
  const mqYear = mqDate.getUTCFullYear();
  const isSunday = mqDayOfWeek === 0;

  // Build decimal-time → RDV map
  const slotMap = new Map<number, Rdv>();
  rdvs.forEach((rdv) => {
    slotMap.set(getMQDecimalTime(rdv.dateHeure), rdv);
  });

  return (
    <div className="space-y-4 animate-fadeIn">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Planning</h1>
        <p className="text-sm text-gray-500">
          {loading ? "Chargement…" : `${rdvs.length} rendez-vous`}
        </p>
      </div>

      {/* Navigation + legend */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => navigate(1)}
              className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <h2 className="ml-1 text-base sm:text-lg font-semibold text-gray-900 capitalize">
              {DAYS_FULL_FR[mqDayOfWeek]} {mqDay} {mqMonth} {mqYear}
            </h2>
          </div>
          {!isToday && (
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 text-sm text-navy-600 hover:text-navy-800 border border-navy-200 rounded-lg hover:bg-navy-50 transition-colors"
            >
              Aujourd&apos;hui
            </button>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50">
          {Object.entries(RDV_CONFIG).map(([type, cfg]) => (
            <span key={type} className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm">Chargement…</span>
          </div>
        ) : isSunday ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-gray-400">Fermé le dimanche</p>
          </div>
        ) : (
          <>
            {/* Morning */}
            <SectionHeader label="Matin" hours="7h – 12h" />
            {MORNING_SLOTS.map((decimal) => (
              <SlotRow key={decimal} time={decimalToTimeStr(decimal)} rdv={slotMap.get(decimal)} />
            ))}

            {/* Lunch break */}
            <div className="px-4 py-2.5 bg-gray-50 border-y border-gray-100 flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-gray-400 font-medium">Pause — 12h à 13h</p>
            </div>

            {/* Afternoon */}
            <SectionHeader label="Après-midi" hours="13h – 16h" />
            {AFTERNOON_SLOTS.map((decimal) => (
              <SlotRow key={decimal} time={decimalToTimeStr(decimal)} rdv={slotMap.get(decimal)} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ label, hours }: { label: string; hours: string }) {
  return (
    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-xs text-gray-400">{hours}</p>
    </div>
  );
}

function SlotRow({ time, rdv }: { time: string; rdv?: Rdv }) {
  if (!rdv) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
        <span className="text-xs font-mono text-gray-300 w-11 flex-shrink-0 tabular-nums">{time}</span>
        <div className="flex-1 border-b border-dashed border-gray-100" />
      </div>
    );
  }

  const cfg = RDV_CONFIG[rdv.type] ?? {
    label: rdv.type,
    bg: "bg-gray-50/60",
    border: "border-l-gray-300",
    badge: "bg-gray-100 text-gray-700",
    dot: "bg-gray-400",
  };

  const ticket = rdv.client.tickets?.[0];

  return (
    <div className={`flex items-start gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0 ${cfg.bg}`}>
      <span className="text-sm font-mono font-semibold text-gray-700 w-11 flex-shrink-0 tabular-nums mt-1">{time}</span>
      <div className={`flex-1 rounded-lg border border-gray-100 border-l-4 ${cfg.border} bg-white shadow-sm px-3 py-2.5 min-w-0`}>
        {/* Client + type */}
        <div className="flex items-start gap-2 justify-between flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-900 text-sm leading-tight">
                {rdv.client.prenom} {rdv.client.nom}
              </p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${cfg.badge}`}>
                {cfg.label}
              </span>
            </div>
            {rdv.client.telephone && (
              <a
                href={`tel:${rdv.client.telephone}`}
                className="text-xs text-gray-400 hover:text-navy-600 transition-colors mt-0.5 inline-block"
              >
                {rdv.client.telephone}
              </a>
            )}
          </div>
        </div>

        {/* Latest ticket */}
        {ticket && (
          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-semibold text-navy-700 bg-navy-50 px-1.5 py-0.5 rounded">
              {ticket.numero}
            </span>
            <span className="text-xs text-gray-500 truncate">
              {ticket.marque} {ticket.modele} — {ticket.materiel}
            </span>
          </div>
        )}

        {/* Notes */}
        {rdv.notes && (
          <p className="text-xs text-gray-400 mt-1.5 italic leading-relaxed">{rdv.notes}</p>
        )}
      </div>
    </div>
  );
}
