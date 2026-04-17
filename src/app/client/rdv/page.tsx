"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

interface TimeSlot {
  time: string;
  available: boolean;
}

const RDV_TYPES = [
  {
    value: "depot",
    label: "Dépôt de matériel",
    description: "Déposer votre appareil pour réparation",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    value: "retrait",
    label: "Retrait de matériel",
    description: "Récupérer votre appareil réparé",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    value: "diagnostic",
    label: "Diagnostic",
    description: "Diagnostic de votre équipement",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
];

export default function RdvPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Get min date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  // Get max date (3 months from now)
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  useEffect(() => {
    if (selectedDate) {
      setSlotsLoading(true);
      setSelectedTime("");
      fetch(`/api/rdv/slots?date=${selectedDate}`)
        .then((r) => r.json())
        .then((data) => setSlots(data.slots || []))
        .finally(() => setSlotsLoading(false));
    }
  }, [selectedDate]);

  const handleConfirm = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/rdv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, time: selectedTime, type: selectedType, notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de la réservation");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="animate-fadeIn">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Rendez-vous confirmé!</h2>
          <p className="text-gray-500 mb-1">
            <strong>{RDV_TYPES.find((t) => t.value === selectedType)?.label}</strong>
          </p>
          <p className="text-gray-500 mb-1">
            {formatDate(selectedDate)} à {selectedTime}
          </p>
          <p className="text-sm text-gray-400 mt-4">Un email et un message WhatsApp de confirmation vous ont été envoyés.</p>
          <div className="flex gap-3 justify-center mt-6">
            <Button variant="outline" onClick={() => router.push("/client/dashboard")}>
              Mes tickets
            </Button>
            <Button onClick={() => { setSuccess(false); setStep(1); setSelectedType(""); setSelectedDate(""); setSelectedTime(""); setNotes(""); }}>
              Nouveau RDV
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Prendre un rendez-vous</h1>
        <p className="text-gray-500 text-sm hidden sm:block">SAV Les Hauts de Californie — Horaires: 7h-12h et 13h-16h00</p>
        <p className="text-gray-500 text-xs sm:hidden">Horaires: 7h-12h et 13h-16h00</p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                step >= s ? "bg-navy-700 text-white" : "bg-gray-200 text-gray-400"
              }`}
            >
              {step > s ? "✓" : s}
            </div>
            {s < 3 && <div className={`flex-1 h-0.5 w-8 ${step > s ? "bg-navy-700" : "bg-gray-200"}`} />}
          </div>
        ))}
        <div className="ml-2 text-sm text-gray-500">
          {step === 1 && "Type de RDV"}
          {step === 2 && "Date et heure"}
          {step === 3 && "Confirmation"}
        </div>
      </div>

      {/* Step 1: Type */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quel type de rendez-vous?</h2>
          <div className="space-y-3">
            {RDV_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => { setSelectedType(type.value); setStep(2); }}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all hover:border-navy-300 hover:bg-navy-50/30 active:bg-navy-50 min-h-[64px] ${
                  selectedType === type.value ? "border-navy-700 bg-navy-50" : "border-gray-100"
                }`}
              >
                <span className="text-navy-600 flex-shrink-0">{type.icon}</span>
                <div>
                  <p className="font-semibold text-gray-900">{type.label}</p>
                  <p className="text-sm text-gray-500">{type.description}</p>
                </div>
                <svg className="w-5 h-5 text-gray-300 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Date and time */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Choisissez une date et un horaire</h2>
            <button onClick={() => setStep(1)} className="text-sm text-gray-400 hover:text-gray-600">← Modifier le type</button>
          </div>

          <div className="inline-flex items-center gap-2 bg-navy-50 text-navy-700 px-3 py-2 rounded-lg text-sm font-medium">
            <span className="w-4 h-4">{RDV_TYPES.find((t) => t.value === selectedType)?.icon}</span>
            {RDV_TYPES.find((t) => t.value === selectedType)?.label}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={minDate}
              max={maxDateStr}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
            />
            <p className="text-xs text-gray-400 mt-1">Fermé le dimanche. Samedi: matin uniquement.</p>
          </div>

          {selectedDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Heure disponible</label>
              {slotsLoading ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Chargement des créneaux...
                </div>
              ) : slots.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun créneau disponible ce jour.</p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => slot.available && setSelectedTime(slot.time)}
                      disabled={!slot.available}
                      className={`py-2.5 px-2 rounded-lg text-sm font-medium border transition-all min-h-[44px] ${
                        selectedTime === slot.time
                          ? "bg-navy-700 text-white border-navy-700"
                          : slot.available
                          ? "border-gray-200 text-gray-700 hover:border-navy-300 hover:bg-navy-50 active:bg-navy-100"
                          : "border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50 line-through"
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informations complémentaires..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
            />
          </div>

          <Button
            disabled={!selectedDate || !selectedTime}
            onClick={() => setStep(3)}
            className="w-full"
          >
            Continuer →
          </Button>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Confirmer le rendez-vous</h2>
            <button onClick={() => setStep(2)} className="text-sm text-gray-400 hover:text-gray-600">← Modifier</button>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Type</span>
              <span className="font-medium text-gray-900">
                {RDV_TYPES.find((t) => t.value === selectedType)?.label}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date</span>
              <span className="font-medium text-gray-900">
                {new Date(selectedDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Heure</span>
              <span className="font-medium text-gray-900">{selectedTime}</span>
            </div>
            {notes && (
              <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                <span className="text-gray-500">Notes</span>
                <span className="font-medium text-gray-900 text-right max-w-48">{notes}</span>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
            <p>Une confirmation sera envoyée par <strong>email et WhatsApp</strong> après validation.</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          <Button onClick={handleConfirm} loading={loading} className="w-full" size="lg">
            Confirmer le rendez-vous
          </Button>
        </div>
      )}
    </div>
  );
}
