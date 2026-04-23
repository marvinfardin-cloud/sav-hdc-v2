import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientSession } from "@/lib/auth";
import { noCacheHeaders } from "@/lib/utils";

export async function GET() {
  const session = await getClientSession();
  if (!session?.client) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401, headers: noCacheHeaders() });
  }

  const [tickets, unreadMessages] = await Promise.all([
    prisma.ticket.findMany({
      where: { clientId: session.client.id, messages: { some: {} } },
      include: {
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    prisma.message.findMany({
      where: { ticket: { clientId: session.client.id }, senderType: "ADMIN", readAt: null },
      select: { ticketId: true },
    }),
  ]);

  const unreadByTicket: Record<string, number> = {};
  for (const m of unreadMessages) {
    unreadByTicket[m.ticketId] = (unreadByTicket[m.ticketId] || 0) + 1;
  }

  const threads = tickets
    .map((t) => ({
      ticketId: t.id,
      numero: t.numero,
      materiel: t.materiel,
      marque: t.marque,
      statut: t.statut,
      lastMessage: t.messages[0]
        ? {
            content: t.messages[0].content,
            senderType: t.messages[0].senderType,
            createdAt: t.messages[0].createdAt.toISOString(),
          }
        : null,
      unread: unreadByTicket[t.id] || 0,
    }))
    .sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });

  return NextResponse.json(threads, { headers: noCacheHeaders() });
}
