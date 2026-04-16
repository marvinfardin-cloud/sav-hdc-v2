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
    <header className="bg-navy-700 shadow-sm sticky top-0 z-20">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/client/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.66 7.93L12 2.27 6.34 7.93c-3.12 3.12-3.12 8.19 0 11.31C7.9 20.8 9.95 21.58 12 21.58c2.05 0 4.1-.78 5.66-2.34 3.12-3.12 3.12-8.19 0-11.31zM12 19.59c-1.6 0-3.11-.62-4.24-1.76C6.62 16.69 6 15.19 6 13.59s.62-3.11 1.76-4.24L12 5.1v14.49z"/>
              </svg>
            </div>
            <span className="text-white font-semibold text-sm hidden sm:block">Les Hauts de Californie</span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            <Link
              href="/client/dashboard"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/client/dashboard"
                  ? "bg-white/10 text-white"
                  : "text-navy-200 hover:bg-white/5 hover:text-white"
              }`}
            >
              Mes tickets
            </Link>
            <Link
              href="/client/rdv"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/client/rdv"
                  ? "bg-white/10 text-white"
                  : "text-navy-200 hover:bg-white/5 hover:text-white"
              }`}
            >
              Prendre RDV
            </Link>
          </nav>

          {/* User */}
          <div className="flex items-center gap-2">
            <span className="text-navy-200 text-sm hidden sm:block">{clientName}</span>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="p-2 text-navy-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
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
