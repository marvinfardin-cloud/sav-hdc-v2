"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate, formatDateTime, RDV_TYPE_LABELS, RDV_TYPE_COLORS } from "@/lib/utils";

interface ClientDetail {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  createdAt: string;
  tickets: {
    id: string;
    numero: string;
    materiel: string;
    marque: string;
    modele: string;
    statut: string;
    createdAt: string;
    technicien?: { nom: string } | null;
  }[];
  rdvs: {
    id: string;
    dateHeure: string;
    type: string;
    statut: string;
    notes?: string;
  }[];
}

export default function ClientDetailPage() {
  const params = useParams();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/clients/${params.id}`)
      .then((r) => r.json())
      .then(setClient)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <svg className="animate-spin w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    );
  }

  if (!client) {
    return <div className="text-center py-20 text-gray-400">Client introuvable</div>;
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl">
      <div>
        <Link href="/admin/clients" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Clients
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-navy-100 rounded-full flex items-center justify-center">
            <span className="text-navy-700 font-bold text-lg">
              {client.prenom.charAt(0)}{client.nom.charAt(0)}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.prenom} {client.nom}</h1>
            <p className="text-gray-500 text-sm">Client depuis le {formatDate(client.createdAt)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client info */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Informations</h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Email</p>
              <a href={`mailto:${client.email}`} className="text-navy-600 hover:underline">{client.email}</a>
            </div>
            {client.telephone && (
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Téléphone</p>
                <a href={`tel:${client.telephone}`} className="text-gray-900 hover:text-navy-600">{client.telephone}</a>
              </div>
            )}
            <div className="pt-3 border-t border-gray-100 flex gap-4 text-center">
              <div className="flex-1">
                <p className="text-2xl font-bold text-navy-700">{client.tickets.length}</p>
                <p className="text-xs text-gray-400">Tickets</p>
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-navy-700">{client.rdvs.length}</p>
                <p className="text-xs text-gray-400">RDV</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tickets */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Tickets SAV ({client.tickets.length})</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {client.tickets.length === 0 ? (
                <p className="px-6 py-8 text-center text-gray-400 text-sm">Aucun ticket</p>
              ) : (
                client.tickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/admin/tickets/${ticket.id}`}
                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono font-semibold text-navy-600 text-sm">{ticket.numero}</span>
                        <StatusBadge statut={ticket.statut} size="sm" />
                      </div>
                      <p className="text-sm text-gray-700">{ticket.marque} {ticket.modele} — {ticket.materiel}</p>
                      <p className="text-xs text-gray-400">{formatDate(ticket.createdAt)}</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Rendez-vous ({client.rdvs.length})</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {client.rdvs.length === 0 ? (
                <p className="px-6 py-8 text-center text-gray-400 text-sm">Aucun rendez-vous</p>
              ) : (
                client.rdvs.map((rdv) => (
                  <div key={rdv.id} className="flex items-center gap-4 px-6 py-3.5">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{formatDateTime(rdv.dateHeure)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${RDV_TYPE_COLORS[rdv.type] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                          {RDV_TYPE_LABELS[rdv.type] || rdv.type}
                        </span>
                      </div>
                      {rdv.notes && <p className="text-xs text-gray-400 mt-0.5">{rdv.notes}</p>}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${rdv.statut === "confirme" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {rdv.statut}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
