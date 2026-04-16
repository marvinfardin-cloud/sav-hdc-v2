import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.EMAIL_FROM || "SAV Les Hauts de Californie <noreply@hauts-californie.fr>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Les Hauts de Californie</title>
  <style>
    body { margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f6f9; }
    .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background-color: #1e3a5f; padding: 30px 40px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
    .header p { color: #a8bcd4; margin: 8px 0 0; font-size: 13px; }
    .body { padding: 40px; }
    .body h2 { color: #1e3a5f; margin: 0 0 20px; font-size: 20px; }
    .body p { color: #4a5568; line-height: 1.7; margin: 0 0 16px; }
    .info-box { background: #f0f4f9; border-left: 4px solid #1e3a5f; border-radius: 4px; padding: 16px 20px; margin: 20px 0; }
    .info-box p { margin: 6px 0; color: #2d3748; font-size: 14px; }
    .info-box strong { color: #1e3a5f; }
    .btn { display: inline-block; background-color: #1e3a5f; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 15px; margin: 20px 0; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: #dbeafe; color: #1e40af; }
    .footer { background: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { color: #94a3b8; font-size: 12px; margin: 4px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Les Hauts de Californie</h1>
      <p>Service Après-Vente — Matériels de Jardinage</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>Les Hauts de Californie — SAV Matériels de Jardinage</p>
      <p>Martinique, French Caribbean</p>
      <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendMagicLink(email: string, prenom: string, token: string) {
  const link = `${APP_URL}/api/auth/verify?token=${token}`;

  const content = `
    <h2>Bonjour ${prenom},</h2>
    <p>Vous avez demandé à vous connecter à votre espace client SAV Les Hauts de Californie.</p>
    <p>Cliquez sur le bouton ci-dessous pour vous connecter. Ce lien est valable <strong>1 heure</strong>.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${link}" class="btn">Se connecter à mon espace</a>
    </div>
    <p style="font-size: 13px; color: #94a3b8;">Si vous n'avez pas demandé cette connexion, ignorez simplement cet email.</p>
    <p style="font-size: 12px; color: #94a3b8; word-break: break-all;">Lien direct : ${link}</p>
  `;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Votre lien de connexion - Les Hauts de Californie",
    html: baseTemplate(content),
  });
}

export async function sendRdvConfirmation(
  email: string,
  prenom: string,
  rdv: { dateHeure: Date; type: string; notes?: string | null }
) {
  const dateStr = rdv.dateHeure.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const heureStr = rdv.dateHeure.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const typeLabels: Record<string, string> = {
    depot: "Dépôt de matériel",
    retrait: "Retrait de matériel",
    diagnostic: "Diagnostic",
  };

  const content = `
    <h2>Bonjour ${prenom},</h2>
    <p>Votre rendez-vous est confirmé. Voici le récapitulatif :</p>
    <div class="info-box">
      <p><strong>Type :</strong> ${typeLabels[rdv.type] || rdv.type}</p>
      <p><strong>Date :</strong> ${dateStr}</p>
      <p><strong>Heure :</strong> ${heureStr}</p>
      ${rdv.notes ? `<p><strong>Notes :</strong> ${rdv.notes}</p>` : ""}
    </div>
    <p>Merci de vous présenter à l'heure indiquée avec votre matériel (si dépôt).</p>
    <p>En cas d'empêchement, merci de nous contacter dès que possible.</p>
  `;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Confirmation de votre rendez-vous",
    html: baseTemplate(content),
  });
}

const STATUT_LABELS: Record<string, string> = {
  RECU: "Reçu",
  DIAGNOSTIC: "En diagnostic",
  ATTENTE_PIECES: "En attente de pièces",
  EN_REPARATION: "En réparation",
  PRET: "Prêt à récupérer",
  LIVRE: "Livré",
};

export async function sendStatusUpdate(
  email: string,
  prenom: string,
  ticket: {
    numero: string;
    materiel: string;
    marque: string;
    modele: string;
    statut: string;
    notesPubliques?: string | null;
    dateEstimee?: Date | null;
  }
) {
  const statutLabel = STATUT_LABELS[ticket.statut] || ticket.statut;
  const isReady = ticket.statut === "PRET";

  const content = `
    <h2>Bonjour ${prenom},</h2>
    <p>Le statut de votre équipement a été mis à jour.</p>
    <div class="info-box">
      <p><strong>Ticket :</strong> ${ticket.numero}</p>
      <p><strong>Matériel :</strong> ${ticket.marque} ${ticket.modele} (${ticket.materiel})</p>
      <p><strong>Statut :</strong> <span class="status-badge">${statutLabel}</span></p>
      ${ticket.notesPubliques ? `<p><strong>Message :</strong> ${ticket.notesPubliques}</p>` : ""}
      ${ticket.dateEstimee ? `<p><strong>Date estimée :</strong> ${ticket.dateEstimee.toLocaleDateString("fr-FR")}</p>` : ""}
    </div>
    ${isReady ? `<p><strong>Votre matériel est prêt ! Vous pouvez venir le récupérer pendant nos heures d'ouverture.</strong></p>` : ""}
    <div style="text-align: center; margin: 24px 0;">
      <a href="${APP_URL}/client/tickets" class="btn">Voir mes tickets</a>
    </div>
  `;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Mise à jour de votre ticket ${ticket.numero}`,
    html: baseTemplate(content),
  });
}

export async function sendCustomEmail(
  email: string,
  prenom: string,
  subject: string,
  message: string,
  ticketNumero?: string
) {
  const content = `
    <h2>Bonjour ${prenom},</h2>
    ${ticketNumero ? `<p style="color: #64748b; font-size: 13px;">Référence ticket : <strong>${ticketNumero}</strong></p>` : ""}
    <div style="margin: 20px 0;">
      ${message.split("\n").map((line) => `<p>${line}</p>`).join("")}
    </div>
  `;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject,
    html: baseTemplate(content),
  });
}
