"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

export default function ClientNav({ clientName }: { clientName: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const firstName = clientName.split(" ")[0];

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-20 shadow-sm" style={{ backgroundColor: "#F47920" }}>
      {/* sheen */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(120% 80% at 85% -20%, rgba(255,255,255,0.22), transparent 55%)" }}
      />
      <div className="relative max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo + brand */}
          <Link href="/client/dashboard" className="flex items-center gap-2.5 min-h-[44px]">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.22)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" className="w-5 h-5 object-contain" alt="JardiPro" />
            </div>
            <div className="leading-tight">
              <div className="text-white font-bold text-sm leading-none">JardiPro</div>
              <div className="text-white/75 text-[10px] font-medium uppercase tracking-wide leading-none mt-0.5 hidden sm:block">
                Espace SAV · {firstName}
              </div>
            </div>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            <Link
              href="/client/dashboard"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] flex items-center ${
                pathname === "/client/dashboard"
                  ? "bg-white/15 text-white"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              Mes tickets
            </Link>
            <Link
              href="/client/rdv"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] flex items-center ${
                pathname === "/client/rdv"
                  ? "bg-white/15 text-white"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              Prendre RDV
            </Link>
          </nav>

          {/* Logout icon button */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Se déconnecter"
            className="flex items-center justify-center w-9 h-9 rounded-xl transition-colors min-w-[44px] min-h-[44px]"
            style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.22)" }}
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
