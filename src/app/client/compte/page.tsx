"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ORANGE = "#F47920";
const INK = "#0F0F12";
const INK2 = "#4A4A52";
const INK3 = "#8A8A92";
const LINE = "rgba(15,15,18,0.06)";

interface ClientInfo {
  prenom: string;
  nom: string;
  email: string;
  telephone: string | null;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border p-5" style={{ borderColor: LINE }}>
      <h2 className="text-sm font-semibold mb-4" style={{ color: INK }}>{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: INK3 }}>{label}</label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2"
      style={{
        borderColor: LINE,
        color: INK,
        backgroundColor: "#FAFAF7",
        ...(props.style ?? {}),
      }}
    />
  );
}

function SaveButton({ loading, label = "Enregistrer" }: { loading: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
      style={{ backgroundColor: ORANGE }}
    >
      {loading ? "Enregistrement…" : label}
    </button>
  );
}

function Alert({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <p
      className="text-xs font-medium rounded-lg px-3 py-2"
      style={{
        backgroundColor: ok ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
        color: ok ? "#059669" : "#DC2626",
      }}
    >
      {msg}
    </p>
  );
}

export default function ComptePage() {
  const router = useRouter();
  const [info, setInfo] = useState<ClientInfo | null>(null);

  // Profile form
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [profileMsg, setProfileMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Password form
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdMsg, setPwdMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [pwdLoading, setPwdLoading] = useState(false);

  // Email form
  const [newEmail, setNewEmail] = useState("");
  const [emailPwd, setEmailPwd] = useState("");
  const [emailMsg, setEmailMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/client/me")
      .then((r) => r.json())
      .then((d: ClientInfo) => {
        setInfo(d);
        setPrenom(d.prenom);
        setNom(d.nom);
        setTelephone(d.telephone ?? "");
      });
  }, []);

  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/client/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "profile", prenom, nom, telephone }),
      });
      const data = await res.json();
      if (res.ok) {
        setInfo((prev) => prev ? { ...prev, prenom, nom, telephone: telephone || null } : prev);
        setProfileMsg({ text: "Informations mises à jour", ok: true });
      } else {
        setProfileMsg({ text: data.error || "Erreur", ok: false });
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      setPwdMsg({ text: "Les mots de passe ne correspondent pas", ok: false });
      return;
    }
    setPwdLoading(true);
    setPwdMsg(null);
    try {
      const res = await fetch("/api/client/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "password", currentPassword: currentPwd, newPassword: newPwd }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentPwd("");
        setNewPwd("");
        setConfirmPwd("");
        setPwdMsg({ text: "Mot de passe modifié", ok: true });
      } else {
        setPwdMsg({ text: data.error || "Erreur", ok: false });
      }
    } finally {
      setPwdLoading(false);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setEmailMsg(null);
    try {
      const res = await fetch("/api/client/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "email", newEmail, password: emailPwd }),
      });
      const data = await res.json();
      if (res.ok) {
        setInfo((prev) => prev ? { ...prev, email: newEmail.toLowerCase() } : prev);
        setNewEmail("");
        setEmailPwd("");
        setEmailMsg({ text: "Email modifié", ok: true });
      } else {
        setEmailMsg({ text: data.error || "Erreur", ok: false });
      }
    } finally {
      setEmailLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/login");
  };

  if (!info) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: `${ORANGE} transparent transparent transparent` }} />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold" style={{ color: INK }}>Mon compte</h1>

      {/* Profile info */}
      <Section title="Informations personnelles">
        {/* Read-only email display */}
        <p className="text-xs mb-4 px-3 py-2.5 rounded-xl border" style={{ borderColor: LINE, color: INK2, backgroundColor: "#F5F5F2" }}>
          <span style={{ color: INK3 }}>Email actuel : </span>
          <span className="font-medium">{info.email}</span>
        </p>
        <form onSubmit={handleProfile} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom">
              <Input value={prenom} onChange={(e) => setPrenom(e.target.value)} required placeholder="Prénom" />
            </Field>
            <Field label="Nom">
              <Input value={nom} onChange={(e) => setNom(e.target.value)} required placeholder="Nom" />
            </Field>
          </div>
          <Field label="Téléphone">
            <Input
              type="tel"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder="+596 696 12 34 56"
            />
          </Field>
          {profileMsg && <Alert msg={profileMsg.text} ok={profileMsg.ok} />}
          <SaveButton loading={profileLoading} />
        </form>
      </Section>

      {/* Change password */}
      <Section title="Changer le mot de passe">
        <form onSubmit={handlePassword} className="space-y-3">
          <Field label="Mot de passe actuel">
            <Input
              type="password"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              required
              placeholder="••••••••"
            />
          </Field>
          <Field label="Nouveau mot de passe">
            <Input
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              required
              placeholder="••••••••"
            />
          </Field>
          <Field label="Confirmer le nouveau mot de passe">
            <Input
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              required
              placeholder="••••••••"
            />
          </Field>
          {pwdMsg && <Alert msg={pwdMsg.text} ok={pwdMsg.ok} />}
          <SaveButton loading={pwdLoading} label="Modifier le mot de passe" />
        </form>
      </Section>

      {/* Change email */}
      <Section title="Changer l'adresse email">
        <form onSubmit={handleEmail} className="space-y-3">
          <Field label="Nouvel email">
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              placeholder="nouveau@email.com"
            />
          </Field>
          <Field label="Confirmez avec votre mot de passe">
            <Input
              type="password"
              value={emailPwd}
              onChange={(e) => setEmailPwd(e.target.value)}
              required
              placeholder="••••••••"
            />
          </Field>
          {emailMsg && <Alert msg={emailMsg.text} ok={emailMsg.ok} />}
          <SaveButton loading={emailLoading} label="Modifier l'email" />
        </form>
      </Section>

      {/* Logout */}
      <div className="pb-4">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full py-3 rounded-2xl text-sm font-semibold transition-opacity disabled:opacity-50"
          style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#DC2626" }}
        >
          {loggingOut ? "Déconnexion…" : "Se déconnecter"}
        </button>
      </div>
    </div>
  );
}
