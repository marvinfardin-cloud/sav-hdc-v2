"use client";

import { useState, useRef, useCallback } from "react";

// ── Design tokens ──────────────────────────────────────────────────────────────
const ORANGE      = "#F47920";
const ORANGE_DARK = "#D9621A";
const INK         = "#0F0F12";
const INK2        = "#4A4A52";
const INK3        = "#8A8A92";
const LINE        = "rgba(15,15,18,0.06)";

// ── Helpers ────────────────────────────────────────────────────────────────────

function resizeImage(file: File, maxPx = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.65));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// Return today's date in Martinique local time as "YYYY-MM-DD"
function mtnToday(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Martinique" });
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function parseDate(dateStr: string): { year: number; month: number; day: number } {
  const [y, m, d] = dateStr.split("-").map(Number);
  return { year: y, month: m, day: d };
}

function isWeekend(dateStr: string): boolean {
  const { year, month, day } = parseDate(dateStr);
  const dow = new Date(year, month - 1, day).getDay();
  return dow === 0 || dow === 6;
}

function dayOfWeekLocal(dateStr: string): number {
  const { year, month, day } = parseDate(dateStr);
  return new Date(year, month - 1, day).getDay(); // 0=Sun 1=Mon..6=Sat
}

function formatSlot(time: string): string {
  return time; // "07:00" etc.
}

const DAY_NAMES = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

// ── Types ──────────────────────────────────────────────────────────────────────

interface Slot { time: string; available: boolean }

interface WizardData {
  materiel: string;
  marque: string;
  modele: string;
  panneDeclaree: string;
  photoDataUrl: string | null;
  selectedDate: string | null;
  selectedTime: string | null;
}

// ── Step indicator ─────────────────────────────────────────────────────────────

function StepDots({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className="rounded-full transition-all duration-300"
          style={{
            width: n === step ? 20 : 8,
            height: 8,
            background: n === step ? ORANGE : n < step ? `${ORANGE}66` : LINE,
          }}
        />
      ))}
    </div>
  );
}

// ── Step 1: Machine info ───────────────────────────────────────────────────────

function Step1({
  data,
  onChange,
  onNext,
}: {
  data: WizardData;
  onChange: (partial: Partial<WizardData>) => void;
  onNext: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [marqueSelect, setMarqueSelect] = useState(
    ["STIHL", "OREC", "KIVA", "GTS", "BUGNOT", "RAPID", "VIKING"].includes(data.marque)
      ? data.marque
      : data.marque
      ? "Autre"
      : ""
  );

  const canNext = data.materiel.trim() && data.marque.trim() && data.modele.trim() && data.panneDeclaree.trim();

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoLoading(true);
    try {
      const dataUrl = await resizeImage(file);
      onChange({ photoDataUrl: dataUrl });
    } catch { /* ignore */ }
    setPhotoLoading(false);
  };

  const inputCls = "w-full px-3 py-3 border rounded-xl text-[14px] focus:outline-none focus:ring-2 transition-colors bg-white";
  const inputStyle = { borderColor: LINE, color: INK };
  const focusOrange = { "--tw-ring-color": ORANGE } as React.CSSProperties;

  return (
    <div className="flex flex-col gap-4 px-5 pb-5">
      <div>
        <label className="block text-[13px] font-semibold mb-1.5" style={{ color: INK }}>
          Type de matériel <span style={{ color: ORANGE }}>*</span>
        </label>
        <input
          type="text"
          value={data.materiel}
          onChange={(e) => onChange({ materiel: e.target.value })}
          placeholder="ex: Tondeuse, Débroussailleuse..."
          className={inputCls}
          style={{ ...inputStyle, ...focusOrange }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: INK }}>
            Marque <span style={{ color: ORANGE }}>*</span>
          </label>
          <select
            value={marqueSelect}
            onChange={(e) => {
              setMarqueSelect(e.target.value);
              if (e.target.value !== "Autre") onChange({ marque: e.target.value });
              else onChange({ marque: "" });
            }}
            className={inputCls}
            style={{ ...inputStyle, ...focusOrange }}
          >
            <option value="">Sélectionner…</option>
            {["STIHL", "OREC", "KIVA", "GTS", "BUGNOT", "RAPID", "VIKING"].map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
            <option value="Autre">Autre</option>
          </select>
          {marqueSelect === "Autre" && (
            <input
              type="text"
              value={data.marque}
              placeholder="Préciser la marque"
              className={inputCls + " mt-2"}
              style={{ ...inputStyle, ...focusOrange }}
              onChange={(e) => onChange({ marque: e.target.value })}
            />
          )}
        </div>
        <div>
          <label className="block text-[13px] font-semibold mb-1.5" style={{ color: INK }}>
            Modèle <span style={{ color: ORANGE }}>*</span>
          </label>
          <input
            type="text"
            value={data.modele}
            onChange={(e) => onChange({ modele: e.target.value })}
            placeholder="ex: FS 55"
            className={inputCls}
            style={{ ...inputStyle, ...focusOrange }}
          />
        </div>
      </div>

      <div>
        <label className="block text-[13px] font-semibold mb-1.5" style={{ color: INK }}>
          Description de la panne <span style={{ color: ORANGE }}>*</span>
        </label>
        <textarea
          value={data.panneDeclaree}
          onChange={(e) => onChange({ panneDeclaree: e.target.value })}
          rows={4}
          placeholder="Décrivez le problème : symptômes, quand ça se produit, bruits anormaux..."
          className={inputCls + " resize-none"}
          style={{ ...inputStyle, ...focusOrange }}
        />
      </div>

      {/* Photo upload */}
      <div>
        <label className="block text-[13px] font-semibold mb-1.5" style={{ color: INK }}>
          Photo du matériel <span className="font-normal" style={{ color: INK3 }}>(optionnel)</span>
        </label>
        {data.photoDataUrl ? (
          <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: LINE }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.photoDataUrl} alt="aperçu" className="w-full h-32 object-cover" />
            <button
              onClick={() => onChange({ photoDataUrl: null })}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={photoLoading}
            className="w-full border-2 border-dashed rounded-xl py-5 flex flex-col items-center gap-2 transition-colors"
            style={{ borderColor: `${ORANGE}40`, background: `${ORANGE}08` }}
          >
            {photoLoading ? (
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24" style={{ color: ORANGE }}>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ color: ORANGE }}>
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 12V4m0 0L9 7m3-3 3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-[13px] font-medium" style={{ color: ORANGE }}>Ajouter une photo</span>
                <span className="text-[11px]" style={{ color: INK3 }}>JPG, PNG · max 900 px</span>
              </>
            )}
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
      </div>

      <button
        onClick={onNext}
        disabled={!canNext}
        className="w-full py-3.5 rounded-xl text-white text-[15px] font-bold flex items-center justify-center gap-2 transition-opacity"
        style={{
          background: canNext
            ? `linear-gradient(180deg, ${ORANGE} 0%, ${ORANGE_DARK} 100%)`
            : LINE,
          color: canNext ? "#fff" : INK3,
          boxShadow: canNext ? "0 4px 14px rgba(244,121,32,0.3)" : "none",
        }}
      >
        Choisir un créneau
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}

// ── Step 2: Calendar + slot picker ─────────────────────────────────────────────

function Step2({
  data,
  onChange,
  onBack,
  onNext,
}: {
  data: WizardData;
  onChange: (partial: Partial<WizardData>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const today      = mtnToday();
  const maxDate    = addDays(today, 30);

  const [calMonth, setCalMonth] = useState<{ year: number; month: number }>(() => {
    const { year, month } = parseDate(today);
    return { year, month };
  });

  const [slots, setSlots]             = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotError, setSlotError]     = useState("");

  const fetchSlots = useCallback((dateStr: string) => {
    setSlotsLoading(true);
    setSlotError("");
    setSlots([]);
    fetch(`/api/rdv/slots?date=${dateStr}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .catch(() => setSlotError("Impossible de charger les créneaux"))
      .finally(() => setSlotsLoading(false));
  }, []);

  const selectDate = (dateStr: string) => {
    onChange({ selectedDate: dateStr, selectedTime: null });
    fetchSlots(dateStr);
  };

  // Build calendar grid for the current displayed month
  const { year, month } = calMonth;
  const firstDow  = new Date(year, month - 1, 1).getDay(); // 0=Sun
  // Convert to Mon-first: Mon=0..Sun=6
  const firstOffset = (firstDow + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();

  // Prev / Next month buttons
  const prevMonth = () => {
    setCalMonth(({ year, month }) => month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 });
  };
  const nextMonth = () => {
    setCalMonth(({ year, month }) => month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 });
  };

  const canNext = !!data.selectedDate && !!data.selectedTime;

  return (
    <div className="flex flex-col gap-4 px-5 pb-5">
      {/* Calendar */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: LINE }}>
        {/* Month header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: LINE }}>
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: INK2 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span className="text-[14px] font-bold" style={{ color: INK }}>
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: INK2 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Day headers (Mon–Sun) */}
        <div className="grid grid-cols-7 border-b" style={{ borderColor: LINE }}>
          {DAY_NAMES.map((d, i) => (
            <div
              key={d}
              className="py-2 text-center text-[11px] font-bold uppercase"
              style={{ color: i >= 5 ? "#CBD5E1" : INK3 }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 p-1.5 gap-0.5">
          {Array.from({ length: firstOffset }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day    = i + 1;
            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const past    = dateStr < today;
            const future  = dateStr > maxDate;
            const weekend = isWeekend(dateStr);
            const disabled = past || future || weekend;
            const selected = data.selectedDate === dateStr;
            const isToday  = dateStr === today;
            const dow      = dayOfWeekLocal(dateStr);
            const isSat    = dow === 6;
            const isSun    = dow === 0;

            return (
              <button
                key={dateStr}
                disabled={disabled}
                onClick={() => !disabled && selectDate(dateStr)}
                className="aspect-square rounded-lg flex items-center justify-center text-[13px] font-medium transition-all"
                style={{
                  color: disabled
                    ? (isSat || isSun ? "#CBD5E1" : "#CBD5E1")
                    : selected ? "#fff" : isToday ? ORANGE : INK,
                  background: selected ? ORANGE : isToday && !selected ? `${ORANGE}15` : "transparent",
                  fontWeight: selected || isToday ? 700 : 500,
                  cursor: disabled ? "default" : "pointer",
                }}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Slots */}
      {data.selectedDate && (
        <div>
          <p className="text-[13px] font-semibold mb-2" style={{ color: INK }}>
            Créneaux disponibles
          </p>
          {slotError && (
            <p className="text-[13px] text-red-600 mb-2">{slotError}</p>
          )}
          {slotsLoading ? (
            <div className="flex justify-center py-6">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24" style={{ color: ORANGE }}>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
          ) : slots.length === 0 ? (
            <p className="text-[13px] py-4 text-center" style={{ color: INK3 }}>
              Aucun créneau disponible ce jour.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-1.5">
              {slots.map((slot) => {
                const active = data.selectedTime === slot.time;
                return (
                  <button
                    key={slot.time}
                    disabled={!slot.available}
                    onClick={() => slot.available && onChange({ selectedTime: slot.time })}
                    className="py-2.5 rounded-xl text-[13px] font-semibold transition-all"
                    style={{
                      background: !slot.available
                        ? "#F5F5F5"
                        : active
                        ? ORANGE
                        : "#fff",
                      color: !slot.available ? "#C4C4C4" : active ? "#fff" : INK,
                      border: `1px solid ${!slot.available ? "#E5E5E5" : active ? ORANGE : LINE}`,
                      boxShadow: active ? "0 2px 8px rgba(244,121,32,0.3)" : "none",
                      cursor: !slot.available ? "default" : "pointer",
                    }}
                  >
                    {formatSlot(slot.time)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2.5 mt-auto pt-2">
        <button
          onClick={onBack}
          className="flex-1 py-3.5 rounded-xl text-[14px] font-semibold border transition-colors"
          style={{ borderColor: LINE, color: INK2, background: "#fff" }}
        >
          ← Retour
        </button>
        <button
          onClick={onNext}
          disabled={!canNext}
          className="flex-1 py-3.5 rounded-xl text-[15px] font-bold text-white transition-opacity"
          style={{
            background: canNext
              ? `linear-gradient(180deg, ${ORANGE} 0%, ${ORANGE_DARK} 100%)`
              : LINE,
            color: canNext ? "#fff" : INK3,
            boxShadow: canNext ? "0 4px 14px rgba(244,121,32,0.3)" : "none",
          }}
        >
          Suivant →
        </button>
      </div>
    </div>
  );
}

// ── Step 3: Confirmation ───────────────────────────────────────────────────────

const WEEKDAY_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const MONTH_FR   = ["jan.", "fév.", "mar.", "avr.", "mai", "juin", "juil.", "août", "sep.", "oct.", "nov.", "déc."];

function formatRdvDate(dateStr: string, timeStr: string): string {
  const { year, month, day } = parseDate(dateStr);
  const dow = new Date(year, month - 1, day).getDay();
  return `${WEEKDAY_FR[dow]} ${day} ${MONTH_FR[month - 1]} ${year} à ${timeStr}`;
}

function Step3({
  data,
  onBack,
  onSuccess,
  onClose,
}: {
  data: WizardData;
  onBack: () => void;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState("");
  const [success, setSuccess]           = useState(false);
  const [ticketNumero, setTicketNumero] = useState("");

  const handleConfirm = async () => {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/tickets/with-rdv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materiel:      data.materiel,
          marque:        data.marque,
          modele:        data.modele,
          panneDeclaree: data.panneDeclaree,
          rdvDate:       data.selectedDate,
          rdvTime:       data.selectedTime,
          photoDataUrl:  data.photoDataUrl ?? undefined,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setTicketNumero(json.ticket?.numero ?? "");
        setSuccess(true);
      } else if (res.status === 409) {
        setError(json.error || "Ce créneau vient d'être pris, veuillez en choisir un autre");
        onBack();
      } else {
        setError(json.error || "Erreur lors de la soumission");
      }
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center px-5 pb-8 pt-4 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: `${ORANGE}15` }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M4 12.5 9 17.5 20 6.5" stroke={ORANGE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 className="text-[18px] font-bold mb-1" style={{ color: INK }}>Demande confirmée !</h3>
        <p className="text-[13.5px] mb-1" style={{ color: INK2 }}>
          Votre ticket <span className="font-bold font-mono" style={{ color: ORANGE }}>{ticketNumero}</span> a été créé.
        </p>
        <p className="text-[13px] mb-6" style={{ color: INK3 }}>
          Un email de confirmation vous a été envoyé.
        </p>
        <button
          onClick={() => { onSuccess(); onClose(); }}
          className="w-full py-3.5 rounded-xl text-white text-[15px] font-bold"
          style={{
            background: `linear-gradient(180deg, ${ORANGE} 0%, ${ORANGE_DARK} 100%)`,
            boxShadow: "0 4px 14px rgba(244,121,32,0.3)",
          }}
        >
          Voir mes réparations
        </button>
      </div>
    );
  }

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between gap-3 py-2.5 border-b last:border-0" style={{ borderColor: LINE }}>
      <span className="text-[13px]" style={{ color: INK3 }}>{label}</span>
      <span className="text-[13px] font-semibold text-right" style={{ color: INK }}>{value}</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 px-5 pb-5">
      {error && (
        <div className="p-3 rounded-xl border text-[13px]" style={{ background: "#FEF2F2", borderColor: "#FCA5A5", color: "#DC2626" }}>
          {error}
        </div>
      )}

      {/* Machine summary */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: LINE }}>
        <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: LINE, background: "#FAFAFA" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M4 16h16l-1.5-5H5.5L4 16Z" stroke={ORANGE} strokeWidth="1.7" strokeLinejoin="round"/>
            <circle cx="8" cy="18.5" r="2" stroke={ORANGE} strokeWidth="1.7"/>
            <circle cx="16" cy="18.5" r="2" stroke={ORANGE} strokeWidth="1.7"/>
            <path d="M9 11V7.5A2.5 2.5 0 0 1 11.5 5h1A2.5 2.5 0 0 1 15 7.5V11" stroke={ORANGE} strokeWidth="1.7" strokeLinecap="round"/>
          </svg>
          <span className="text-[12px] font-bold uppercase tracking-wide" style={{ color: ORANGE }}>La machine</span>
        </div>
        <div className="px-4">
          <Row label="Type"    value={data.materiel} />
          <Row label="Marque"  value={data.marque} />
          <Row label="Modèle"  value={data.modele} />
          <Row label="Panne"   value={data.panneDeclaree.length > 60 ? data.panneDeclaree.slice(0, 57) + "…" : data.panneDeclaree} />
        </div>
      </div>

      {/* RDV summary */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: LINE }}>
        <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: LINE, background: "#FAFAFA" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="5.5" width="16" height="14.5" rx="2.2" stroke={ORANGE} strokeWidth="1.7"/>
            <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" stroke={ORANGE} strokeWidth="1.7" strokeLinecap="round"/>
          </svg>
          <span className="text-[12px] font-bold uppercase tracking-wide" style={{ color: ORANGE }}>Rendez-vous de dépôt</span>
        </div>
        <div className="px-4 py-3">
          <p className="text-[14px] font-semibold" style={{ color: INK }}>
            {formatRdvDate(data.selectedDate!, data.selectedTime!)}
          </p>
          <p className="text-[12px] mt-0.5" style={{ color: INK3 }}>SAV Les Hauts de Californie</p>
        </div>
      </div>

      <div className="flex gap-2.5 mt-auto pt-1">
        <button
          onClick={onBack}
          disabled={submitting}
          className="flex-1 py-3.5 rounded-xl text-[14px] font-semibold border transition-colors"
          style={{ borderColor: LINE, color: INK2, background: "#fff" }}
        >
          ← Retour
        </button>
        <button
          onClick={handleConfirm}
          disabled={submitting}
          className="flex-1 py-3.5 rounded-xl text-[15px] font-bold text-white flex items-center justify-center gap-2 transition-opacity"
          style={{
            background: `linear-gradient(180deg, ${ORANGE} 0%, ${ORANGE_DARK} 100%)`,
            boxShadow: "0 4px 14px rgba(244,121,32,0.3)",
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Envoi...
            </>
          ) : "Confirmer ma demande"}
        </button>
      </div>
    </div>
  );
}

// ── Main wizard ────────────────────────────────────────────────────────────────

const STEP_TITLES = ["La machine", "Choisir un créneau", "Confirmation"];

export function TicketWizard({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [data, setData] = useState<WizardData>({
    materiel: "", marque: "", modele: "", panneDeclaree: "",
    photoDataUrl: null, selectedDate: null, selectedTime: null,
  });
  const [slotError, setSlotError] = useState("");

  const patch = (partial: Partial<WizardData>) => setData((d) => ({ ...d, ...partial }));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50">
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg flex flex-col"
        style={{ maxHeight: "92dvh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-0 flex-shrink-0">
          <h2 className="text-[17px] font-bold" style={{ color: INK }}>
            {STEP_TITLES[step - 1]}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: LINE, color: INK3 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <StepDots step={step} />

        {slotError && (
          <div className="mx-5 mb-3 p-3 rounded-xl border text-[13px]"
            style={{ background: "#FEF2F2", borderColor: "#FCA5A5", color: "#DC2626" }}>
            {slotError}
          </div>
        )}

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          {step === 1 && (
            <Step1 data={data} onChange={patch} onNext={() => { setSlotError(""); setStep(2); }} />
          )}
          {step === 2 && (
            <Step2
              data={data}
              onChange={(partial) => { setSlotError(""); patch(partial); }}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <Step3
              data={data}
              onBack={() => { setSlotError("Ce créneau était déjà pris, veuillez en choisir un autre."); setStep(2); }}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
