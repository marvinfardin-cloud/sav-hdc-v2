"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ORANGE = "#F47920";
const INK3 = "#8A8A92";

const TABS = [
  {
    label: "Accueil",
    href: "/client/dashboard",
    match: (p: string) => p === "/client/dashboard",
    icon: (c: string) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M4 11 12 4l8 7v9h-5v-6h-6v6H4v-9Z" stroke={c} strokeWidth="1.7" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: "Tickets",
    href: "/client/dashboard",
    match: (_: string) => false,
    icon: (c: string) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" stroke={c} strokeWidth="1.6"/>
        <path d="M12 6v12" stroke={c} strokeWidth="1.6" strokeDasharray="2 2"/>
      </svg>
    ),
  },
  {
    label: "RDV",
    href: "/client/rdv",
    match: (p: string) => p === "/client/rdv",
    icon: (c: string) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="5.5" width="16" height="14.5" rx="2.2" stroke={c} strokeWidth="1.7"/>
        <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: "Compte",
    href: "#",
    match: (_: string) => false,
    icon: (c: string) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8.5" r="3.5" stroke={c} strokeWidth="1.7"/>
        <path d="M4.5 20c1.2-3.8 4.1-5.5 7.5-5.5s6.3 1.7 7.5 5.5" stroke={c} strokeWidth="1.7" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t"
      style={{ background: "#fff", borderColor: "rgba(15,15,18,0.06)" }}
    >
      <div className="grid grid-cols-4">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const color = active ? ORANGE : INK3;
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className="flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] active:opacity-60 transition-opacity"
            >
              {tab.icon(color)}
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
