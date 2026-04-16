"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/Badge";
import { StatusTimeline } from "@/components/client/StatusTimeline";
import { formatDate } from "@/lib/utils";

interface TicketDetail {
  id: string;
  numero: string;
  materiel: string;
  marque: string;
  modele: string;
  numeroSerie?: string;
  panneDeclaree: string;
  statut: string;
  dateDepot: string;
  dateEstimee?: string;
  notesPubliques?: string;
  createdAt: string;
  technicien?: { nom: string } | null;
  historique: { id: string; statut: string; note?: string; createdAt: string }[];
}

export default function ClientTicketDetailPage() {
  const params = useParams();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tickets/${params.id}`)
      .then((r) => r.json())
      .then(setTicket)
      .finally(() => setLoading(false));
  }, [params.id]);

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

  if (!ticket) {
    return <div className="text-center py-20 text-gray-400">Ticket introuvable</div>;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <Link href="/client/dashboard" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Mes tickets
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 font-mono">{ticket.numero}</h1>
              <StatusBadge statut={ticket.statut} />
            </div>
            <p className="text-gray-500 text-sm mt-1">
              {ticket.marque} {ticket.modele} — {ticket.materiel}
            </p>
          </div>
        </div>
      </div>

      {/* Ready notification */}
      {ticket.statut === "PRET" && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold text-green-800">Votre matériel est prêt!</p>
            <p className="text-sm text-green-700 mt-0.5">Vous pouvez venir le récupérer pendant nos heures d&apos;ouverture (7h-12h et 13h-15h).</p>
            <Link href="/client/rdv" className="mt-2 inline-block text-sm font-medium text-green-700 underline hover:text-green-800">
              Prendre un RDV pour le retrait →
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Equipment info */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Matériel</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Type</span>
              <span className="font-medium text-gray-900">{ticket.materiel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Marque / Modèle</span>
              <span className="font-medium text-gray-900">{ticket.marque} {ticket.modele}</span>
            </div>
            {ticket.numeroSerie && (
              <div className="flex justify-between">
                <span className="text-gray-500">N° de série</span>
                <span className="font-mono text-gray-900">{ticket.numeroSerie}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Date de dépôt</span>
              <span className="font-medium text-gray-900">{formatDate(ticket.dateDepot)}</span>
            </div>
            {ticket.dateEstimee && (
              <div className="flex justify-between">
                <span className="text-gray-500">Date estimée</span>
                <span className="font-medium text-gray-900">{formatDate(ticket.dateEstimee)}</span>
              </div>
            )}
            {ticket.technicien && (
              <div className="flex justify-between">
                <span className="text-gray-500">Technicien</span>
                <span className="font-medium text-gray-900">{ticket.technicien.nom}</span>
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Panne déclarée</p>
            <p className="text-sm text-gray-700">{ticket.panneDeclaree}</p>
          </div>
        </div>

        {/* Notes */}
        {ticket.notesPubliques && (
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
            <h2 className="font-semibold text-blue-900 mb-2">Message de l&apos;atelier</h2>
            <p className="text-sm text-blue-800">{ticket.notesPubliques}</p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-6">Suivi de réparation</h2>
        <StatusTimeline historique={ticket.historique} currentStatut={ticket.statut} />
      </div>
    </div>
  );
}
