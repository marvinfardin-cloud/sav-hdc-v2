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

interface NewTicketForm {
  materiel: string;
  marque: string;
  modele: string;
  numeroSerie: string;
  panneDeclaree: string;
}

export default function ClientDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState<NewTicketForm>({
    materiel: "",
    marque: "",
    modele: "",
    numeroSerie: "",
    panneDeclaree: "",
  });

  const loadTickets = () => {
    fetch("/api/tickets")
      .then((r) => r.json())
      .then(setTickets)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materiel: form.materiel,
          marque: form.marque,
          modele: form.modele,
          numeroSerie: form.numeroSerie || undefined,
          panneDeclaree: form.panneDeclaree,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setShowModal(false);
        setForm({ materiel: "", marque: "", modele: "", numeroSerie: "", panneDeclaree: "" });
        setLoading(true);
        loadTickets();
      } else {
        setSubmitError(data.error || "Erreur lors de la soumission");
      }
    } catch {
      setSubmitError("Erreur de connexion au serveur");
    } finally {
      setSubmitting(false);
    }
  };

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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes tickets SAV</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm min-h-[44px]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Soumettre une demande</span>
            <span className="sm:hidden">Demande</span>
          </button>
          <Link
            href="/client/rdv"
            className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm min-h-[44px]" style={{ backgroundColor: "#F47920" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Prendre RDV
          </Link>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucun ticket pour l&apos;instant</h3>
          <p className="text-gray-500 text-sm mb-4">Vous n&apos;avez pas encore de ticket SAV en cours.</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Soumettre une demande de réparation
          </button>
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
                className="flex items-center gap-3 px-4 sm:px-6 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors min-h-[64px]"
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
                <div className="border-t border-gray-100 px-4 sm:px-6 py-4">
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

      {/* New ticket modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Soumettre une demande de réparation</h2>
              <button
                onClick={() => { setShowModal(false); setSubmitError(""); }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitTicket} className="px-6 py-5 space-y-4">
              {submitError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {submitError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de matériel <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="materiel"
                  value={form.materiel}
                  onChange={handleFormChange}
                  required
                  placeholder="ex: Tondeuse, Débroussailleuse, Tronçonneuse..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-navy-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marque <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="marque"
                    value={form.marque}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stihl-500 focus:border-stihl-500 transition-colors bg-white"
                  >
                    <option value="">Sélectionner...</option>
                    {["STIHL", "BUGNOT", "GTS", "KIVA", "OREC", "RAPID"].map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modèle <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="modele"
                    value={form.modele}
                    onChange={handleFormChange}
                    required
                    placeholder="ex: HRX476, FS 55..."
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-navy-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro de série <span className="text-gray-400 font-normal">(optionnel)</span>
                </label>
                <input
                  type="text"
                  name="numeroSerie"
                  value={form.numeroSerie}
                  onChange={handleFormChange}
                  placeholder="ex: MZBB-6130001"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-navy-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description de la panne <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="panneDeclaree"
                  value={form.panneDeclaree}
                  onChange={handleFormChange}
                  required
                  rows={4}
                  placeholder="Décrivez le problème en détail: symptômes, quand ça se produit, bruits anormaux..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-navy-500 transition-colors resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setSubmitError(""); }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]" style={{ backgroundColor: "#F47920" }}
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Envoi...
                    </>
                  ) : (
                    "Soumettre la demande"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
