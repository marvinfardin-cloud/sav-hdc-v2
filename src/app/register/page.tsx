"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
    password: "",
    confirmPassword: "",
  });
  const [rgpd, setRgpd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (form.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    if (!rgpd) {
      setError("Vous devez accepter la politique de confidentialité pour continuer");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prenom: form.prenom,
          nom: form.nom,
          email: form.email,
          telephone: form.telephone,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/client/dashboard");
      } else {
        setError(data.error || "Erreur lors de la création du compte");
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Créer un compte</h2>
          <p className="text-gray-500 text-sm mb-6">Suivez vos réparations en ligne.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input
                  type="text"
                  name="prenom"
                  value={form.prenom}
                  onChange={handleChange}
                  required
                  placeholder="Marie"
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-navy-500 transition-colors min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  name="nom"
                  value={form.nom}
                  onChange={handleChange}
                  required
                  placeholder="Dupont"
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-navy-500 transition-colors min-h-[44px]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="votre@email.com"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-navy-500 transition-colors min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                name="telephone"
                value={form.telephone}
                onChange={handleChange}
                required
                placeholder="+596 696 12 34 56"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-navy-500 transition-colors min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-navy-500 transition-colors min-h-[44px]"
              />
              <p className="text-xs text-gray-400 mt-1">Minimum 8 caractères</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-navy-500 transition-colors min-h-[44px]"
              />
            </div>
            <div className="flex items-start gap-3 pt-1">
              <input
                type="checkbox"
                id="rgpd"
                checked={rgpd}
                onChange={(e) => setRgpd(e.target.checked)}
                className="mt-0.5 w-4 h-4 shrink-0 accent-[#F47920] cursor-pointer"
              />
              <label htmlFor="rgpd" className="text-sm text-gray-600 leading-snug cursor-pointer">
                J&apos;accepte la{" "}
                <a
                  href="/politique-confidentialite"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline hover:opacity-80"
                  style={{ color: "#F47920" }}
                >
                  politique de confidentialité
                </a>{" "}
                et les conditions d&apos;utilisation de Quavio.
              </label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-3 px-4 rounded-lg font-medium text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]" style={{ backgroundColor: "#F47920" }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Création du compte...
                </>
              ) : (
                "Créer mon compte"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Déjà un compte ?{" "}
            <Link href="/login" className="font-medium hover:underline" style={{ color: "#F47920" }}>
              Se connecter
            </Link>
          </p>
        </div>

        <p className="text-center text-white/60 text-xs mt-6">
          Accès client — Espace de suivi SAV
          <span className="mx-2">·</span>
          <a href="/politique-confidentialite" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/80 transition-colors">
            Politique de confidentialité
          </a>
        </p>
      </div>
    </div>
  );
}
