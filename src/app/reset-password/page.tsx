"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setError(data.error || "Erreur serveur");
      }
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-600 text-sm mb-4">Lien invalide ou manquant.</p>
        <Link href="/forgot-password" className="text-sm font-medium hover:underline" style={{ color: "#F47920" }}>
          Refaire une demande
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full mb-4">
          <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Mot de passe mis à jour</h2>
        <p className="text-gray-500 text-sm">Redirection vers la connexion...</p>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Nouveau mot de passe</h2>
      <p className="text-gray-500 text-sm mb-6">Choisissez un nouveau mot de passe pour votre compte.</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-stihl-500 focus:border-stihl-500 transition-colors min-h-[44px]"
          />
          <p className="text-xs text-gray-400 mt-1">Minimum 8 caractères</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="••••••••"
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
              Enregistrement...
            </>
          ) : (
            "Enregistrer le mot de passe"
          )}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
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
          <Suspense fallback={<p className="text-sm text-gray-400 text-center">Chargement...</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>

        <p className="text-center text-white/60 text-xs mt-6">
          Accès client — Espace de suivi SAV
        </p>
      </div>
    </div>
  );
}
