import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientSession } from "@/lib/auth";
import { noCacheHeaders } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const session = await getClientSession();
  if (!session?.client) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401, headers: noCacheHeaders() });
  }

  const { endpoint, keys } = await request.json();
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Subscription invalide" }, { status: 400, headers: noCacheHeaders() });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth, clientId: session.client.id },
    create: { clientId: session.client.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
  });

  return NextResponse.json({ ok: true }, { headers: noCacheHeaders() });
}

export async function DELETE(request: NextRequest) {
  const session = await getClientSession();
  if (!session?.client) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401, headers: noCacheHeaders() });
  }

  const { endpoint } = await request.json();
  if (endpoint) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint, clientId: session.client.id },
    });
  }

  return NextResponse.json({ ok: true }, { headers: noCacheHeaders() });
}
