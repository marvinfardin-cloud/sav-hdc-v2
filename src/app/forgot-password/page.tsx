"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json();
        setError(data.error || "Erreur serveur");
      }
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#F47920" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" className="w-12 h-12 object-contain" alt="JardiPro" />
          </div>
          <h1 className="text-2xl font-bold text-white">Les Hauts de Californie</h1>
          <p className="text-white/80 text-sm mt-1">Espace Client SAV JardiPro</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {sent ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Email envoyé</h2>
              <p className="text-gray-500 text-sm mb-6">
                Si un compte existe pour <strong>{email}</strong>, vous recevrez un lien de réinitialisation valable 1 heure.
              </p>
              <Link href="/login" className="text-sm font-medium hover:underline" style={{ color: "#F47920" }}>
                ← Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Mot de passe oublié ?</h2>
              <p className="text-gray-500 text-sm mb-6">
                Saisissez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="votre@email.com"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-stihl-500 focus:border-stihl-500 transition-colors min-h-[44px]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-white py-3 px-4 rounded-lg font-medium text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
                  style={{ backgroundColor: "#F47920" }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Envoi...
                    </>
                  ) : (
                    "Envoyer le lien"
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                <Link href="/login" className="font-medium hover:underline" style={{ color: "#F47920" }}>
                  ← Retour à la connexion
                </Link>
              </p>
            </>
          )}
        </div>

        <p className="text-center text-white/60 text-xs mt-6">
          Accès client — Espace de suivi SAV
        </p>
      </div>
    </div>
  );
}
