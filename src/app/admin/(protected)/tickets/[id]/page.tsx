"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { StatusTimeline } from "@/components/client/StatusTimeline";
import { ChatPanel } from "@/components/ui/ChatPanel";
import { formatDate, formatDateTime, STATUT_LABELS } from "@/lib/utils";

interface TechnicianInfo {
  id: string;
  prenom: string;
  nom: string;
  initiales: string;
  couleur: string;
}

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
  notesPrivees?: string;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
  };
  technicien?: TechnicianInfo | null;
  historique: { id: string; statut: string; note?: string; createdAt: string }[];
}

const STATUTS = ["RECU", "DIAGNOSTIC", "ATTENTE_PIECES", "EN_REPARATION", "PRET", "LIVRE"];

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [ticket, setTicket]         = useState<TicketDetail | null>(null);
  const [loading, setLoading]       = useState(true);
  const [technicians, setTechnicians] = useState<TechnicianInfo[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<"status" | "email" | "whatsapp" | "cloturer" | null>(null);

  const fetchTicket = async () => {
    const res = await fetch(`/api/admin/tickets/${params.id}`);
    if (res.ok) setTicket(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchTicket(); }, [params.id]);

  useEffect(() => {
    fetch("/api/admin/technicians")
      .then((r) => r.json())
      .then(setTechnicians)
      .catch(() => {});
  }, []);

  const assignTechnician = async (technicienId: string | null) => {
    if (!ticket) return;
    setAssignLoading(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticket.id}/technician`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicienId }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTicket((prev) => prev ? { ...prev, technicien: updated.technicien } : prev);
      }
    } finally {
      setAssignLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center gap-2 text-gray-500">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Chargement...
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Ticket introuvable</p>
        <Link href="/admin/tickets" className="text-navy-600 text-sm mt-2 block">← Retour aux tickets</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn max-w-6xl">
      {/* Breadcrumb & header */}
      <div>
        <Link href="/admin/tickets" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Tickets
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 font-mono">{ticket.numero}</h1>
              <StatusBadge statut={ticket.statut} />
            </div>
            <p className="text-gray-500 text-sm mt-1">
              {ticket.marque} {ticket.modele} — {ticket.materiel}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveModal("email")}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </Button>
            {ticket.client.telephone && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveModal("whatsapp")}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </Button>
            )}
            {ticket.statut === "LIVRE" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveModal("cloturer")}
                className="border-zinc-300 text-zinc-600 hover:bg-zinc-50"
              >
                Clôturer
              </Button>
            )}
            <Button size="sm" onClick={() => setActiveModal("status")}>
              Mettre à jour
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Ticket info */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Informations du ticket</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Matériel</p>
                <p className="font-medium text-gray-900">{ticket.materiel}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Marque / Modèle</p>
                <p className="font-medium text-gray-900">{ticket.marque} {ticket.modele}</p>
              </div>
              {ticket.numeroSerie && (
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">N° de série</p>
                  <p className="font-medium text-gray-900 font-mono">{ticket.numeroSerie}</p>
                </div>
              )}
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Date de dépôt</p>
                <p className="font-medium text-gray-900">{formatDate(ticket.dateDepot)}</p>
              </div>
              {ticket.dateEstimee && (
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Date estimée</p>
                  <p className="font-medium text-gray-900">{formatDate(ticket.dateEstimee)}</p>
                </div>
              )}
              {ticket.technicien && (
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Technicien</p>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: ticket.technicien.couleur }}
                    >
                      {ticket.technicien.initiales}
                    </span>
                    <p className="font-medium text-gray-900">
                      {ticket.technicien.prenom} {ticket.technicien.nom}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Panne déclarée</p>
              <p className="text-gray-800 bg-gray-50 rounded-lg p-3 text-sm">{ticket.panneDeclaree}</p>
            </div>
            {ticket.notesPubliques && (
              <div className="mt-4">
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Notes publiques</p>
                <p className="text-gray-800 bg-blue-50 rounded-lg p-3 text-sm border border-blue-100">{ticket.notesPubliques}</p>
              </div>
            )}
            {ticket.notesPrivees && (
              <div className="mt-4">
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Notes privées</p>
                <p className="text-gray-800 bg-amber-50 rounded-lg p-3 text-sm border border-amber-100">{ticket.notesPrivees}</p>
              </div>
            )}
          </div>

          {/* Status history */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-6">Historique des statuts</h2>
            <StatusTimeline historique={ticket.historique} currentStatut={ticket.statut} />
          </div>

          {/* Messages */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style={{ height: 500 }}>
            <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="font-semibold text-gray-900">Messages</h2>
              <p className="text-xs text-gray-400 mt-0.5">Conversation avec le client</p>
            </div>
            <ChatPanel
              ticketId={ticket.id}
              senderType="ADMIN"
              fetchUrl={`/api/admin/tickets/${ticket.id}/messages`}
              postUrl={`/api/admin/tickets/${ticket.id}/messages`}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client info */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Client</h2>
              <Link
                href={`/admin/clients/${ticket.client.id}`}
                className="text-xs text-navy-600 hover:text-navy-800 font-medium"
              >
                Voir profil →
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-navy-700 font-semibold text-sm">
                    {ticket.client.prenom.charAt(0)}{ticket.client.nom.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {ticket.client.prenom} {ticket.client.nom}
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <a
                  href={`mailto:${ticket.client.email}`}
                  className="flex items-center gap-2 text-gray-600 hover:text-navy-700"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {ticket.client.email}
                </a>
                {ticket.client.telephone && (
                  <a
                    href={`tel:${ticket.client.telephone}`}
                    className="flex items-center gap-2 text-gray-600 hover:text-navy-700"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {ticket.client.telephone}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Technician assignment */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Technicien assigné</h2>
            <div className="space-y-3">
              {ticket.technicien && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <span
                    className="w-9 h-9 rounded-full text-sm font-bold flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: ticket.technicien.couleur }}
                  >
                    {ticket.technicien.initiales}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {ticket.technicien.prenom} {ticket.technicien.nom}
                    </p>
                  </div>
                </div>
              )}
              <select
                value={ticket.technicien?.id ?? ""}
                onChange={(e) => assignTechnician(e.target.value || null)}
                disabled={assignLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white disabled:opacity-60"
              >
                <option value="">— Non assigné —</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.initiales} · {t.prenom} {t.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Actions rapides</h2>
            <div className="space-y-2">
              <button
                onClick={() => setActiveModal("status")}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-navy-700 bg-navy-50 hover:bg-navy-100 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Changer le statut
              </button>
              <button
                onClick={() => setActiveModal("email")}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Envoyer un email
              </button>
              {ticket.client.telephone && (
                <button
                  onClick={() => setActiveModal("whatsapp")}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Envoyer WhatsApp
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal === "cloturer" && (
        <ClotureModal
          ticket={ticket}
          onClose={() => setActiveModal(null)}
          onSuccess={() => { setActiveModal(null); fetchTicket(); }}
        />
      )}
      {activeModal === "status" && (
        <StatusModal
          ticket={ticket}
          onClose={() => setActiveModal(null)}
          onSuccess={fetchTicket}
        />
      )}
      {activeModal === "email" && (
        <EmailModal
          ticket={ticket}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === "whatsapp" && (
        <WhatsAppModal
          ticket={ticket}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}

function ClotureModal({ ticket, onClose, onSuccess }: { ticket: TicketDetail; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleConfirm = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/tickets/${ticket.id}/close`, { method: "POST" });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Erreur");
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Clôturer le ticket</h2>
          <p className="text-sm text-gray-500 mb-1">
            Ticket <span className="font-mono font-semibold text-gray-700">{ticket.numero}</span>
          </p>
          <p className="text-sm text-gray-500 mb-5">
            Êtes-vous sûr de vouloir clôturer ce ticket ? Cette action est irréversible.
          </p>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
              Annuler
            </Button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-900 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              )}
              Clôturer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusModal({ ticket, onClose, onSuccess }: { ticket: TicketDetail; onClose: () => void; onSuccess: () => void }) {
  const [statut, setStatut] = useState(ticket.statut);
  const [note, setNote] = useState("");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(!!ticket.client.telephone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticket.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut, note, notifyEmail, notifyWhatsapp }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Erreur");
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold">Mettre à jour le statut</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <Select
            label="Nouveau statut"
            value={statut}
            onChange={(e) => setStatut(e.target.value)}
            required
          >
            {STATUTS.map((s) => (
              <option key={s} value={s}>{STATUT_LABELS[s]}</option>
            ))}
          </Select>
          <Textarea
            label="Note (optionnelle)"
            placeholder="Ajouter une note à cet historique..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Notifications</p>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.checked)}
                className="rounded"
              />
              Envoyer un email au client
            </label>
            {ticket.client.telephone && (
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyWhatsapp}
                  onChange={(e) => setNotifyWhatsapp(e.target.checked)}
                  className="rounded"
                />
                Envoyer un WhatsApp au client
              </label>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
            <Button type="submit" loading={loading} className="flex-1">Mettre à jour</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EmailModal({ ticket, onClose }: { ticket: TicketDetail; onClose: () => void }) {
  const [subject, setSubject] = useState(`Mise à jour de votre ticket ${ticket.numero}`);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticket.id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Erreur");
        return;
      }
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch {
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold">Envoyer un email</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">Email envoyé avec succès!</div>}
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
            Destinataire: <strong>{ticket.client.prenom} {ticket.client.nom}</strong> — {ticket.client.email}
          </div>
          <Input
            label="Sujet"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
          <Textarea
            label="Message"
            placeholder="Votre message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={5}
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
            <Button type="submit" loading={loading} className="flex-1">Envoyer</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function WhatsAppModal({ ticket, onClose }: { ticket: TicketDetail; onClose: () => void }) {
  const [message, setMessage] = useState(
    `Bonjour ${ticket.client.prenom}, votre ${ticket.materiel} (ticket ${ticket.numero}) est actuellement: ${STATUT_LABELS[ticket.statut]}. Les Hauts de Californie`
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticket.id}/whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Erreur");
        return;
      }
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch {
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold">Envoyer un WhatsApp</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">Message envoyé avec succès!</div>}
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
            Destinataire: <strong>{ticket.client.prenom} {ticket.client.nom}</strong> — {ticket.client.telephone}
          </div>
          <Textarea
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
          />
          <p className="text-xs text-gray-400">{message.length} caractères</p>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
            <Button type="submit" loading={loading} className="flex-1">Envoyer</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
