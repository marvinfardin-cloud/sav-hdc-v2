"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";

export interface Client {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
}

// ── Searchable client combobox ─────────────────────────────────────────────────

function ClientCombobox({
  clients,
  value,
  onChange,
}: {
  clients: Client[];
  value: string;
  onChange: (id: string) => void;
}) {
  const selected   = clients.find((c) => c.id === value) ?? null;
  const [query, setQuery]   = useState("");
  const [open, setOpen]     = useState(false);
  const containerRef        = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? clients.filter((c) => {
        const haystack = `${c.prenom} ${c.nom} ${c.email}`.toLowerCase();
        return query.toLowerCase().split(" ").every((w) => haystack.includes(w));
      })
    : clients;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (client: Client) => {
    onChange(client.id);
    setQuery("");
    setOpen(false);
  };

  const clear = () => {
    onChange("");
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Client <span className="text-red-500">*</span>
      </label>

      {/* Input field */}
      <div className="relative flex items-center">
        <input
          type="text"
          autoComplete="off"
          placeholder={selected ? "" : "Rechercher par nom ou email…"}
          value={open ? query : selected ? `${selected.prenom} ${selected.nom}` : query}
          onFocus={() => { setOpen(true); setQuery(""); }}
          onChange={(e) => { setQuery(e.target.value); onChange(""); }}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 min-h-[44px] pr-8 transition-colors"
        />
        {/* Clear button or chevron */}
        {value ? (
          <button
            type="button"
            onClick={clear}
            className="absolute right-2.5 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <span className="absolute right-2.5 text-gray-400 pointer-events-none">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </span>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-sm text-gray-400 text-center">Aucun client trouvé</div>
          ) : (
            filtered.slice(0, 50).map((c) => (
              <button
                key={c.id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); select(c); }}
                className="w-full text-left px-3 py-2.5 hover:bg-orange-50 transition-colors flex flex-col border-b border-gray-50 last:border-0"
              >
                <span className="text-sm font-medium text-gray-900">{c.prenom} {c.nom}</span>
                <span className="text-xs text-gray-500">{c.email}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export function CreateTicketModal({
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
    if (!form.clientId) { setError("Veuillez sélectionner un client"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur"); return; }
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

          <ClientCombobox
            clients={clients}
            value={form.clientId}
            onChange={(id) => setForm({ ...form, clientId: id })}
          />

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
