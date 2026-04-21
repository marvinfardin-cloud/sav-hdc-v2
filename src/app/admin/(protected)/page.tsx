"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatsCard } from "@/components/admin/StatsCard";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate, formatTime, RDV_TYPE_LABELS, RDV_TYPE_COLORS, STATUT_LABELS } from "@/lib/utils";

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
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center gap-3 text-gray-500">
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
    .filter((s) => !["LIVRE"].includes(s.statut))
    .reduce((a, b) => a + b._count, 0) || 0;

  const pretTickets = stats?.ticketsByStatus.find((s) => s.statut === "PRET")?._count || 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/tickets"
            className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm" style={{ backgroundColor: "#F47920" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau ticket
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total tickets"
          value={stats?.totalTickets || 0}
          subtitle="Tous statuts confondus"
          color="navy"
          href="/admin/tickets"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatsCard
          title="En cours"
          value={activeTickets}
          subtitle="Tickets actifs"
          color="blue"
          href="/admin/tickets?status=active"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Prêts à récupérer"
          value={pretTickets}
          subtitle="À notifier les clients"
          color="green"
          href="/admin/tickets?status=PRET"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="RDV aujourd'hui"
          value={stats?.todayAppointments || 0}
          subtitle="Rendez-vous du jour"
          color="orange"
          href="/admin/planning"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {["RECU", "DIAGNOSTIC", "ATTENTE_PIECES", "EN_REPARATION", "PRET", "LIVRE"].map((statut) => {
          const count = stats?.ticketsByStatus.find((s) => s.statut === statut)?._count || 0;
          return (
            <Link
              key={statut}
              href={`/admin/tickets?status=${statut}`}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow text-center"
            >
              <StatusBadge statut={statut} />
              <p className="text-2xl font-bold text-gray-900 mt-2">{count}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent tickets */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Tickets récents</h2>
            <Link href="/admin/tickets" className="text-sm text-navy-600 hover:text-navy-800 font-medium">
              Voir tout →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {stats?.recentTickets.length === 0 && (
              <p className="px-6 py-8 text-center text-gray-400 text-sm">Aucun ticket</p>
            )}
            {stats?.recentTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/admin/tickets/${ticket.id}`}
                className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono font-semibold text-navy-600">{ticket.numero}</span>
                    <StatusBadge statut={ticket.statut} size="sm" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {ticket.marque} {ticket.modele} — {ticket.client.prenom} {ticket.client.nom}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(ticket.createdAt)}</p>
                </div>
                <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        {/* Today appointments */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Rendez-vous du jour</h2>
            <Link href="/admin/planning" className="text-sm text-navy-600 hover:text-navy-800 font-medium">
              Planning →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {stats?.todayRdvs.length === 0 && (
              <p className="px-6 py-8 text-center text-gray-400 text-sm">Aucun rendez-vous aujourd&apos;hui</p>
            )}
            {stats?.todayRdvs.map((rdv) => (
              <div key={rdv.id} className="px-6 py-3.5">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 text-center">
                    <p className="text-lg font-bold text-navy-700">{formatTime(rdv.dateHeure)}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {rdv.client.prenom} {rdv.client.nom}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${RDV_TYPE_COLORS[rdv.type] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                        {RDV_TYPE_LABELS[rdv.type] || rdv.type}
                      </span>
                    </div>
                    {rdv.client.telephone && (
                      <p className="text-xs text-gray-400 mt-0.5">{rdv.client.telephone}</p>
                    )}
                    {rdv.notes && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{rdv.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
