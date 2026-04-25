"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface NotifTicket {
  id: string;
  numero: string;
  materiel: string;
  marque: string;
  modele: string;
  createdAt: string;
  client: { nom: string; prenom: string };
}

interface NotificationBellProps {
  /** Pass "dark" for use on the orange sidebar, "light" for white backgrounds */
  variant?: "dark" | "light";
}

export function NotificationBell({ variant = "dark" }: NotificationBellProps) {
  const [count, setCount]     = useState(0);
  const [tickets, setTickets] = useState<NotifTicket[]>([]);
  const [open, setOpen]     = useState(false);
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);

  const fetchNotifs = useCallback(() => {
    fetch("/api/admin/notifications")
      .then((r) => r.json())
      .then((d) => {
        setCount(d.count ?? 0);
        setTickets(d.tickets ?? []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const DROP_W = 320; // w-80
      const top    = rect.bottom + 8;
      // Open to the right if there's room, otherwise align to the button's right edge
      if (window.innerWidth - rect.left >= DROP_W) {
        setDropStyle({ top, left: rect.left });
      } else {
        setDropStyle({ top, right: window.innerWidth - rect.right });
      }
    }
    setOpen((v) => !v);
  };

  const handleClose = () => setOpen(false);

  const btnClass =
    variant === "dark"
      ? "relative p-2 text-white rounded-lg hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
      : "relative p-2 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center";

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className={btnClass}
        aria-label={`Notifications${count > 0 ? ` (${count} nouveaux)` : ""}`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {count > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop — above sidebar (z-50) */}
          <div className="fixed inset-0 z-[998]" onClick={handleClose} />

          {/* Dropdown — above backdrop */}
          <div
            className="fixed z-[999] w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden"
            style={dropStyle}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900">Nouveaux tickets</h3>
                {count > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Ticket list */}
            {tickets.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-sm text-gray-400 font-medium">Aucun nouveau ticket</p>
                <p className="text-xs text-gray-300 mt-1">Tout est à jour</p>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                {tickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/admin/tickets/${ticket.id}`}
                    onClick={handleClose}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-orange-50/60 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          stroke="#F47920" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[11px] font-mono font-bold text-[#F47920]">{ticket.numero}</span>
                        <span className="text-[10px] text-gray-400 shrink-0">{formatDate(ticket.createdAt)}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {ticket.client.prenom} {ticket.client.nom}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {ticket.marque} {ticket.modele} — {ticket.materiel}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/60">
              <Link
                href="/admin/tickets?status=RECU"
                onClick={handleClose}
                className="text-xs font-semibold text-[#F47920] hover:opacity-80 transition-opacity"
              >
                Voir tous les tickets reçus →
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
