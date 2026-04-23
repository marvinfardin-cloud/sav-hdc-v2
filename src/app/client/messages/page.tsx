"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const ORANGE = "#F47920";
const INK = "#0F0F12";
const INK2 = "#4A4A52";
const INK3 = "#8A8A92";
const LINE = "rgba(15,15,18,0.06)";

const STATUS_LABELS: Record<string, string> = {
  RECU: "Reçu",
  DIAGNOSTIC: "Diagnostic",
  ATTENTE_PIECES: "Attente pièces",
  EN_REPARATION: "En réparation",
  PRET: "Prêt",
  LIVRE: "Livré",
};

interface Thread {
  ticketId: string;
  numero: string;
  materiel: string;
  marque: string;
  statut: string;
  lastMessage: { content: string; senderType: string; createdAt: string } | null;
  unread: number;
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function MessagesPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/client/messages")
      .then((r) => r.json())
      .then(setThreads)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4" style={{ color: INK }}>
        Messages
      </h1>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${ORANGE} transparent transparent transparent` }} />
        </div>
      )}

      {!loading && threads.length === 0 && (
        <div className="bg-white rounded-2xl border flex flex-col items-center py-16 px-6 text-center" style={{ borderColor: LINE }}>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(244,121,32,0.08)" }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                stroke={ORANGE}
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="font-semibold text-base mb-1" style={{ color: INK }}>
            Aucun message
          </p>
          <p className="text-sm" style={{ color: INK3 }}>
            Les échanges avec le technicien apparaîtront ici.
          </p>
        </div>
      )}

      {!loading && threads.length > 0 && (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: LINE }}>
          {threads.map((thread, i) => (
            <Link
              key={thread.ticketId}
              href={`/client/tickets/${thread.ticketId}`}
              className="flex items-start gap-3 px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              style={{ borderTop: i > 0 ? `1px solid ${LINE}` : undefined }}
            >
              {/* Avatar */}
              <div
                className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
                style={{ background: ORANGE }}
              >
                {thread.marque?.slice(0, 2).toUpperCase() || "??"}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="font-semibold text-sm truncate" style={{ color: INK }}>
                    {thread.materiel}
                    {thread.marque ? ` · ${thread.marque}` : ""}
                  </span>
                  {thread.lastMessage && (
                    <span className="text-xs flex-shrink-0" style={{ color: INK3 }}>
                      {timeAgo(thread.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs truncate" style={{ color: INK2 }}>
                    {thread.lastMessage
                      ? `${thread.lastMessage.senderType === "ADMIN" ? "Technicien : " : "Vous : "}${thread.lastMessage.content}`
                      : "Aucun message"}
                  </p>
                  {thread.unread > 0 && (
                    <span
                      className="flex-shrink-0 min-w-[20px] h-5 rounded-full flex items-center justify-center text-white text-[11px] font-bold px-1"
                      style={{ backgroundColor: "#EF4444" }}
                    >
                      {thread.unread > 9 ? "9+" : thread.unread}
                    </span>
                  )}
                </div>
                <p className="text-[11px] mt-1 font-medium" style={{ color: INK3 }}>
                  #{thread.numero} · {STATUS_LABELS[thread.statut] ?? thread.statut}
                </p>
              </div>

              {/* Chevron */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 mt-1">
                <path d="M9 18l6-6-6-6" stroke={INK3} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
