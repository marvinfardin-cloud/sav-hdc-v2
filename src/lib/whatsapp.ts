import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const FROM = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

function formatPhone(telephone: string): string {
  // Remove spaces and ensure it starts with +
  const cleaned = telephone.replace(/\s/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("00")) return "+" + cleaned.slice(2);
  return "+" + cleaned;
}

export async function sendWhatsAppRdvConfirmation(
  telephone: string,
  prenom: string,
  rdv: { dateHeure: Date; type: string }
) {
  const dateStr = rdv.dateHeure.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const heureStr = rdv.dateHeure.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const typeLabels: Record<string, string> = {
    depot: "dépôt",
    retrait: "retrait",
    diagnostic: "diagnostic",
  };

  const message = `Bonjour ${prenom}, votre RDV du ${dateStr} à ${heureStr} (${typeLabels[rdv.type] || rdv.type}) est confirmé. Les Hauts de Californie`;

  try {
    await client.messages.create({
      from: FROM,
      to: `whatsapp:${formatPhone(telephone)}`,
      body: message,
    });
    return { success: true };
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return { success: false, error };
  }
}

export async function sendWhatsAppStatusUpdate(
  telephone: string,
  prenom: string,
  ticket: { numero: string; materiel: string; statut: string }
) {
  const STATUT_LABELS: Record<string, string> = {
    RECU: "Reçu",
    DIAGNOSTIC: "En diagnostic",
    ATTENTE_PIECES: "En attente de pièces",
    EN_REPARATION: "En réparation",
    PRET: "Prêt à récupérer",
    LIVRE: "Livré",
  };

  const statutLabel = STATUT_LABELS[ticket.statut] || ticket.statut;
  const message = `Bonjour ${prenom}, votre matériel ${ticket.materiel} (ticket ${ticket.numero}) est maintenant: ${statutLabel}. Les Hauts de Californie`;

  try {
    await client.messages.create({
      from: FROM,
      to: `whatsapp:${formatPhone(telephone)}`,
      body: message,
    });
    return { success: true };
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return { success: false, error };
  }
}

export async function sendWhatsAppCustomMessage(telephone: string, message: string) {
  try {
    await client.messages.create({
      from: FROM,
      to: `whatsapp:${formatPhone(telephone)}`,
      body: message,
    });
    return { success: true };
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return { success: false, error };
  }
}
