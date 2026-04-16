import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Les Hauts de Californie — SAV",
  description: "Service Après-Vente — Matériels de Jardinage, Martinique",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
