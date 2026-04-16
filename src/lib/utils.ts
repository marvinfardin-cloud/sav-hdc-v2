export const STATUT_LABELS: Record<string, string> = {
  RECU: "Reçu",
  DIAGNOSTIC: "En diagnostic",
  ATTENTE_PIECES: "Attente pièces",
  EN_REPARATION: "En réparation",
  PRET: "Prêt",
  LIVRE: "Livré",
};

export const STATUT_COLORS: Record<string, string> = {
  RECU: "bg-blue-100 text-blue-800",
  DIAGNOSTIC: "bg-yellow-100 text-yellow-800",
  ATTENTE_PIECES: "bg-orange-100 text-orange-800",
  EN_REPARATION: "bg-purple-100 text-purple-800",
  PRET: "bg-green-100 text-green-800",
  LIVRE: "bg-gray-100 text-gray-800",
};

export const STATUT_ORDER = [
  "RECU",
  "DIAGNOSTIC",
  "ATTENTE_PIECES",
  "EN_REPARATION",
  "PRET",
  "LIVRE",
];

export const RDV_TYPE_LABELS: Record<string, string> = {
  depot: "Dépôt",
  retrait: "Retrait",
  diagnostic: "Diagnostic",
};

export const RDV_TYPE_COLORS: Record<string, string> = {
  depot: "bg-blue-100 text-blue-800 border-blue-200",
  retrait: "bg-green-100 text-green-800 border-green-200",
  diagnostic: "bg-orange-100 text-orange-800 border-orange-200",
};

import type { PrismaClient } from "@/generated/prisma";

export async function generateTicketNumber(prismaClient: PrismaClient): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2);
  const prefix = `DS${year}`;

  const lastTicket = await prismaClient.ticket.findFirst({
    where: { numero: { startsWith: prefix } },
    orderBy: { numero: "desc" },
    select: { numero: true },
  });

  if (!lastTicket) {
    return `${prefix}0001`;
  }

  const lastNum = parseInt(lastTicket.numero.slice(-4), 10);
  const nextNum = lastNum + 1;
  return `${prefix}${String(nextNum).padStart(4, "0")}`;
}

const TZ = "America/Martinique";

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: TZ,
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}

export function noCacheHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };
}
