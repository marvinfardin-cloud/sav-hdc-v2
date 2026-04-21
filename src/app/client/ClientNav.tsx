"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

export default function ClientNav({ clientName }: { clientName: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/login");
  };

  return (
    <header className="shadow-sm sticky top-0 z-20" style={{ backgroundColor: "#F47920" }}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/client/dashboard" className="flex items-center gap-2.5 min-h-[44px]">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" className="w-6 h-6 object-contain" alt="JardiPro" />
            </div>
            <span className="text-white font-semibold text-sm hidden sm:block">Les Hauts de Californie</span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-0.5 sm:gap-1">
            <Link
              href="/client/dashboard"
              className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] flex items-center ${
                pathname === "/client/dashboard"
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              Mes tickets
            </Link>
            <Link
              href="/client/rdv"
              className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] flex items-center ${
                pathname === "/client/rdv"
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              Prendre RDV
            </Link>
          </nav>

          {/* User */}
          <div className="flex items-center gap-2">
            <span className="text-white/70 text-sm hidden sm:block truncate max-w-32">{clientName}</span>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Se déconnecter"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
