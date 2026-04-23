"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const ORANGE = "#F47920";
const INK3 = "#8A8A92";

export default function BottomNav() {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const fetchUnread = () => {
      fetch("/api/client/messages/unread")
        .then((r) => r.json())
        .then((d) => setUnread(d.count ?? 0))
        .catch(() => {});
    };
    fetchUnread();
    const iv = setInterval(fetchUnread, 30000);
    return () => clearInterval(iv);
  }, []);

  const tabs = [
    {
      label: "Accueil",
      href: "/client/dashboard",
      active: pathname === "/client/dashboard",
      badge: 0,
      icon: (c: string) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M4 11 12 4l8 7v9h-5v-6h-6v6H4v-9Z" stroke={c} strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: "Messages",
      href: "/client/messages",
      active: pathname.startsWith("/client/messages"),
      badge: unread,
      icon: (c: string) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            stroke={c}
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      label: "RDV",
      href: "/client/rdv",
      active: pathname === "/client/rdv",
      badge: 0,
      icon: (c: string) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="5.5" width="16" height="14.5" rx="2.2" stroke={c} strokeWidth="1.7" />
          <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" stroke={c} strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: "Compte",
      href: "/client/compte",
      active: pathname === "/client/compte",
      badge: 0,
      icon: (c: string) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8.5" r="3.5" stroke={c} strokeWidth="1.7" />
          <path d="M4.5 20c1.2-3.8 4.1-5.5 7.5-5.5s6.3 1.7 7.5 5.5" stroke={c} strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t"
      style={{ background: "#fff", borderColor: "rgba(15,15,18,0.06)" }}
    >
      <div className="grid grid-cols-4">
        {tabs.map((tab) => {
          const color = tab.active ? ORANGE : INK3;
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className="flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] active:opacity-60 transition-opacity"
            >
              <div className="relative">
                {tab.icon(color)}
                {tab.badge > 0 && (
                  <span
                    className="absolute -top-1 -right-1.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold px-0.5"
                    style={{ backgroundColor: "#EF4444" }}
                  >
                    {tab.badge > 9 ? "9+" : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10.5px] font-semibold" style={{ color }}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
