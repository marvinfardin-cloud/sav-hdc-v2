"use client";

import { useEffect, useState, useCallback } from "react";
import { formatTime, RDV_TYPE_LABELS, RDV_TYPE_COLORS } from "@/lib/utils";

interface Rdv {
  id: string;
  dateHeure: string;
  type: string;
  statut: string;
  notes?: string;
  client: { nom: string; prenom: string; telephone?: string };
}

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAYS_FULL = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const MONTHS_FR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function PlanningPage() {
  const [view, setView] = useState<"week" | "day">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [rdvs, setRdvs] = useState<Rdv[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRdvs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      view,
      date: currentDate.toISOString().split("T")[0],
    });
    const res = await fetch(`/api/admin/rdv?${params}`);
    const data = await res.json();
    setRdvs(data.rdvs || []);
    setLoading(false);
  }, [view, currentDate]);

  useEffect(() => { fetchRdvs(); }, [fetchRdvs]);

  const navigate = (direction: -1 | 1) => {
    const d = new Date(currentDate);
    if (view === "day") d.setDate(d.getDate() + direction);
    else d.setDate(d.getDate() + direction * 7);
    setCurrentDate(d);
  };

  const getDateTitle = () => {
    if (view === "day") {
      return currentDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    }
    const weekStart = getWeekStart(currentDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return `${weekStart.getDate()} — ${weekEnd.getDate()} ${MONTHS_FR[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;
  };

  // For week view, generate the 7 days of the week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = getWeekStart(currentDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  const getRdvsForDate = (date: Date) => {
    const dateStr = date.toLocaleDateString("fr-FR");
    return rdvs.filter((rdv) => {
      const rdvDate = new Date(rdv.dateHeure);
      return rdvDate.toLocaleDateString("fr-FR") === dateStr;
    }).sort((a, b) => new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime());
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Planning</h1>
        <p className="text-sm text-gray-500">Gestion des rendez-vous</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-base font-semibold text-gray-900 capitalize min-w-48 text-center">
            {getDateTitle()}
          </h2>
          <button
            onClick={() => navigate(1)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="ml-2 px-3 py-1.5 text-sm text-navy-600 hover:text-navy-800 border border-navy-200 rounded-lg hover:bg-navy-50 transition-colors"
          >
            Aujourd&apos;hui
          </button>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setView("week")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              view === "week" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Semaine
          </button>
          <button
            onClick={() => setView("day")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              view === "day" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Jour
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(RDV_TYPE_LABELS).map(([type, label]) => (
          <span key={type} className={`text-xs px-3 py-1 rounded-full font-medium border ${RDV_TYPE_COLORS[type]}`}>
            {label}
          </span>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Chargement...
        </div>
      ) : view === "week" ? (
        /* Week view */
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-100">
            {weekDays.map((day, i) => {
              const isToday = day.getTime() === today.getTime();
              return (
                <div
                  key={i}
                  className={`px-3 py-3 text-center border-r last:border-r-0 border-gray-100 ${isToday ? "bg-navy-50" : ""}`}
                >
                  <p className={`text-xs font-medium ${isToday ? "text-navy-600" : "text-gray-400"}`}>
                    {DAYS_FR[i]}
                  </p>
                  <p className={`text-lg font-bold mt-0.5 ${isToday ? "text-navy-700" : "text-gray-800"}`}>
                    {day.getDate()}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-7 min-h-64">
            {weekDays.map((day, i) => {
              const dayRdvs = getRdvsForDate(day);
              const isToday = day.getTime() === today.getTime();
              return (
                <div
                  key={i}
                  className={`p-2 border-r last:border-r-0 border-gray-100 space-y-1.5 ${isToday ? "bg-navy-50/30" : ""}`}
                >
                  {dayRdvs.map((rdv) => (
                    <div
                      key={rdv.id}
                      className={`text-xs rounded-lg p-2 border ${RDV_TYPE_COLORS[rdv.type] || "bg-gray-100 text-gray-700 border-gray-200"}`}
                    >
                      <p className="font-semibold">{formatTime(rdv.dateHeure)}</p>
                      <p className="truncate mt-0.5">{rdv.client.prenom} {rdv.client.nom}</p>
                      <p className="text-xs opacity-75">{RDV_TYPE_LABELS[rdv.type] || rdv.type}</p>
                    </div>
                  ))}
                  {dayRdvs.length === 0 && (
                    <p className="text-xs text-gray-300 text-center pt-4">—</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Day view */
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="font-semibold text-gray-900 capitalize">
              {currentDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {getRdvsForDate(currentDate).length === 0 ? (
              <p className="px-6 py-12 text-center text-gray-400 text-sm">Aucun rendez-vous ce jour</p>
            ) : (
              getRdvsForDate(currentDate).map((rdv) => (
                <div key={rdv.id} className="flex items-start gap-4 px-6 py-4">
                  <div className="flex-shrink-0 w-16 text-center">
                    <p className="text-xl font-bold text-navy-700">{formatTime(rdv.dateHeure)}</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">
                        {rdv.client.prenom} {rdv.client.nom}
                      </p>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${RDV_TYPE_COLORS[rdv.type] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                        {RDV_TYPE_LABELS[rdv.type] || rdv.type}
                      </span>
                    </div>
                    {rdv.client.telephone && (
                      <p className="text-xs text-gray-400 mt-0.5">{rdv.client.telephone}</p>
                    )}
                    {rdv.notes && (
                      <p className="text-sm text-gray-500 mt-1 bg-gray-50 rounded px-2 py-1">{rdv.notes}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
