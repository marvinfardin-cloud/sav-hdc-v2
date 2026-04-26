import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPickupReminder } from "@/lib/email";

export async function GET(request: NextRequest) {
  const secret = request.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const tickets = await prisma.ticket.findMany({
    where: {
      statut: "PRET",
      reminderSent: false,
      updatedAt: { lte: cutoff },
    },
    include: {
      client: { select: { email: true, prenom: true, nom: true } },
    },
  });

  let sent = 0;
  let failed = 0;

  for (const ticket of tickets) {
    try {
      await sendPickupReminder(ticket.client.email, ticket.client.prenom, {
        numero: ticket.numero,
        marque: ticket.marque,
        modele: ticket.modele,
        materiel: ticket.materiel,
      });
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { reminderSent: true },
      });
      sent++;
    } catch (err) {
      console.error(`Reminder failed for ticket ${ticket.numero}:`, err);
      failed++;
    }
  }

  return NextResponse.json({ checked: tickets.length, sent, failed });
}
