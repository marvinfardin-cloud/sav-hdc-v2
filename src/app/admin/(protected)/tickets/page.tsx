"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { formatDate } from "@/lib/utils";

interface Client {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
}

interface Ticket {
  id: string;
  numero: string;
  materiel: string;
  marque: string;
  modele: string;
  statut: string;
  createdAt: string;
  dateEstimee?: string;
  client: Client;
  technicien?: { id: string; prenom: string; nom: string; initiales: string; couleur: string } | null;
  _count?: { messages: number };
}

const STATUTS = ["RECU", "DIAGNOSTIC", "ATTENTE_PIECES", "EN_REPARATION", "PRET", "LIVRE"];
const STATUT_LABELS: Record<string, string> = {
  RECU: "Reçu",
  DIAGNOSTIC: "En diagnostic",
  ATTENTE_PIECES: "Attente pièces",
  EN_REPARATION: "En réparation",
  PRET: "Prêt",
  LIVRE: "Livré",
};

export default function TicketsPage() {
  const searchParams = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/tickets?${params}`);
    const data = await res.json();
    setTickets(data);
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    fetch("/api/admin/clients")
      .then((r) => r.json())
      .then(setClients);
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Tickets SAV</h1>
          <p className="text-sm text-gray-500">{tickets.length} ticket{tickets.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} size="sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Nouveau ticket</span>
          <span className="sm:hidden">Nouveau</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rechercher par numéro, client, matériel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-navy-500 min-h-[44px]"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white min-h-[44px]"
            >
              <option value="">Tous les statuts</option>
              {STATUTS.map((s) => (
                <option key={s} value={s}>{STATUT_LABELS[s]}</option>
              ))}
            </select>
            {(search || statusFilter) && (
              <button
                onClick={() => { setSearch(""); setStatusFilter(""); }}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 min-h-[44px] whitespace-nowrap"
              >
                Effacer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: card list */}
      <div className="md:hidden space-y-2">
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
            <svg className="animate-spin w-5 h-5 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Chargement...
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-400 text-sm">
            Aucun ticket trouvé
          </div>
        ) : (
          tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/admin/tickets/${ticket.id}`}
              className="block bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow active:bg-gray-50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono font-bold text-navy-700 text-sm">{ticket.numero}</span>
                    <StatusBadge statut={ticket.statut} size="sm" />
                    {(ticket._count?.messages ?? 0) > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                        {ticket._count!.messages}
                      </span>
                    )}
                    {ticket.technicien && (
                      <span
                        className="w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: ticket.technicien.couleur }}
                        title={`${ticket.technicien.prenom} ${ticket.technicien.nom}`}
                      >
                        {ticket.technicien.initiales}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {ticket.client.prenom} {ticket.client.nom}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {ticket.marque} {ticket.modele} — {ticket.materiel}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(ticket.createdAt)}</p>
                </div>
                <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ticket</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Matériel</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date dépôt</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Technicien</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Chargement...
                    </div>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">
                    Aucun ticket trouvé
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-navy-700 text-sm">{ticket.numero}</span>
                        {(ticket._count?.messages ?? 0) > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                            {ticket._count!.messages}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{ticket.client.prenom} {ticket.client.nom}</p>
                      <p className="text-xs text-gray-400">{ticket.client.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{ticket.marque} {ticket.modele}</p>
                      <p className="text-xs text-gray-400">{ticket.materiel}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge statut={ticket.statut} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(ticket.createdAt)}</td>
                    <td className="px-6 py-4">
                      {ticket.technicien ? (
                        <div className="flex items-center gap-2">
                          <span
                            className="w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center text-white shrink-0"
                            style={{ backgroundColor: ticket.technicien.couleur }}
                          >
                            {ticket.technicien.initiales}
                          </span>
                          <span className="text-sm text-gray-700">
                            {ticket.technicien.prenom} {ticket.technicien.nom}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/tickets/${ticket.id}`}
                        className="text-navy-600 hover:text-navy-800 text-sm font-medium"
                      >
                        Détails →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <CreateTicketModal
          clients={clients}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => { setShowCreateModal(false); fetchTickets(); }}
        />
      )}
    </div>
  );
}

function CreateTicketModal({
  clients,
  onClose,
  onSuccess,
}: {
  clients: Client[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    clientId: "",
    materiel: "",
    marque: "",
    modele: "",
    numeroSerie: "",
    panneDeclaree: "",
    notesPubliques: "",
    notesPrivees: "",
    dateEstimee: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }
      onSuccess();
    } catch {
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">Nouveau ticket SAV</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          <Select
            label="Client"
            value={form.clientId}
            onChange={(e) => setForm({ ...form, clientId: e.target.value })}
            required
          >
            <option value="">Sélectionner un client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.prenom} {c.nom} — {c.email}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Matériel"
              placeholder="Tondeuse, débroussailleuse..."
              value={form.materiel}
              onChange={(e) => setForm({ ...form, materiel: e.target.value })}
              required
            />
            <Input
              label="Marque"
              placeholder="Honda, Stihl..."
              value={form.marque}
              onChange={(e) => setForm({ ...form, marque: e.target.value })}
              required
            />
            <Input
              label="Modèle"
              placeholder="HRX476..."
              value={form.modele}
              onChange={(e) => setForm({ ...form, modele: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="N° de série"
              placeholder="Optionnel"
              value={form.numeroSerie}
              onChange={(e) => setForm({ ...form, numeroSerie: e.target.value })}
            />
            <Input
              label="Date estimée"
              type="date"
              value={form.dateEstimee}
              onChange={(e) => setForm({ ...form, dateEstimee: e.target.value })}
            />
          </div>

          <Textarea
            label="Panne déclarée"
            placeholder="Description du problème signalé par le client..."
            value={form.panneDeclaree}
            onChange={(e) => setForm({ ...form, panneDeclaree: e.target.value })}
            required
            rows={3}
          />

          <Textarea
            label="Notes publiques (visibles par le client)"
            placeholder="Informations à communiquer au client..."
            value={form.notesPubliques}
            onChange={(e) => setForm({ ...form, notesPubliques: e.target.value })}
            rows={2}
          />

          <Textarea
            label="Notes privées (internes uniquement)"
            placeholder="Notes techniques, références pièces..."
            value={form.notesPrivees}
            onChange={(e) => setForm({ ...form, notesPrivees: e.target.value })}
            rows={2}
          />

          <div className="flex gap-3 pt-2 pb-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 min-h-[44px]">
              Annuler
            </Button>
            <Button type="submit" loading={loading} className="flex-1 min-h-[44px]">
              Créer le ticket
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
