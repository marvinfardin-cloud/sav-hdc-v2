"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/Badge";
import { StatusTimeline } from "@/components/client/StatusTimeline";
import { formatDate } from "@/lib/utils";

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

export default function ClientDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tickets")
      .then((r) => r.json())
      .then(setTickets)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes tickets SAV</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/client/rdv"
          className="flex items-center gap-2 bg-navy-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-800 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Prendre RDV
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucun ticket pour l&apos;instant</h3>
          <p className="text-gray-500 text-sm">Vous n&apos;avez pas encore de ticket SAV en cours.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
                ticket.statut === "PRET" ? "border-green-200 ring-1 ring-green-200" : "border-gray-100"
              }`}
            >
              {/* Card header */}
              <div
                className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono font-bold text-navy-700 text-base">{ticket.numero}</span>
                    <StatusBadge statut={ticket.statut} />
                    {ticket.statut === "PRET" && (
                      <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                        Prêt à récupérer!
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {ticket.marque} {ticket.modele} — {ticket.materiel}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Déposé le {formatDate(ticket.dateDepot)}
                    {ticket.dateEstimee && ` · Estimé le ${formatDate(ticket.dateEstimee)}`}
                    {ticket.technicien && ` · ${ticket.technicien.nom}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Link
                    href={`/client/tickets/${ticket.id}`}
                    className="text-navy-600 hover:text-navy-800 text-sm font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Détails
                  </Link>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === ticket.id ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded content */}
              {expandedId === ticket.id && (
                <div className="border-t border-gray-100 px-6 py-4">
                  {ticket.notesPubliques && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                      <p className="font-medium mb-0.5">Message de l&apos;atelier</p>
                      <p>{ticket.notesPubliques}</p>
                    </div>
                  )}
                  <StatusTimeline historique={ticket.historique} currentStatut={ticket.statut} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
