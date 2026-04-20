import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { noCacheHeaders } from "@/lib/utils";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401, headers: noCacheHeaders() });
  }

  const messages = await prisma.message.findMany({
    where: { ticketId: params.id },
    orderBy: { createdAt: "asc" },
  });

  // Mark client messages as read
  await prisma.message.updateMany({
    where: { ticketId: params.id, senderType: "CLIENT", readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json(messages, { headers: noCacheHeaders() });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401, headers: noCacheHeaders() });
  }

  const body = await request.json();
  const { content, attachments = [] } = body;

  if (!content?.trim() && attachments.length === 0) {
    return NextResponse.json({ error: "Message vide" }, { status: 400, headers: noCacheHeaders() });
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: params.id } });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket introuvable" }, { status: 404, headers: noCacheHeaders() });
  }

  const message = await prisma.message.create({
    data: {
      ticketId: params.id,
      senderId: session.user.id,
      senderType: "ADMIN",
      content: content?.trim() || "",
      attachments,
    },
  });

  return NextResponse.json(message, { status: 201, headers: noCacheHeaders() });
}
