import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientSession } from "@/lib/auth";
import { noCacheHeaders } from "@/lib/utils";

export async function GET() {
  const session = await getClientSession();
  if (!session?.client) {
    return NextResponse.json({ count: 0 }, { headers: noCacheHeaders() });
  }

  const count = await prisma.message.count({
    where: {
      ticket: { clientId: session.client.id },
      senderType: "ADMIN",
      readAt: null,
    },
  });

  return NextResponse.json({ count }, { headers: noCacheHeaders() });
}
