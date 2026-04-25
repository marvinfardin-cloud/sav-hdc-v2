"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { NotificationBell } from "./NotificationBell";

interface AdminShellProps {
  children: React.ReactNode;
  userName?: string;
  userRole?: string;
}

export function AdminShell({ children, userName, userRole }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        userName={userName}
        userRole={userRole}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-navy-700 h-14 flex items-center px-4 shadow-md" style={{ backgroundColor: "#F47920" }}>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 text-white rounded-lg hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Ouvrir le menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="ml-3 flex items-center gap-2 flex-1">
          <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.66 7.93L12 2.27 6.34 7.93c-3.12 3.12-3.12 8.19 0 11.31C7.9 20.8 9.95 21.58 12 21.58c2.05 0 4.1-.78 5.66-2.34 3.12-3.12 3.12-8.19 0-11.31zM12 19.59c-1.6 0-3.11-.62-4.24-1.76C6.62 16.69 6 15.19 6 13.59s.62-3.11 1.76-4.24L12 5.1v14.49z"/>
            </svg>
          </div>
          <span className="text-white font-semibold text-sm">Les Hauts de Californie</span>
        </div>
        <NotificationBell variant="dark" />
      </div>

      {/* Main content */}
      <div className="md:pl-64 pt-14 md:pt-0">
        <main className="p-4 sm:p-6 md:p-8 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
