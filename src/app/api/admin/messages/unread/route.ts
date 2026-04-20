import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { noCacheHeaders } from "@/lib/utils";

export async function GET() {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ count: 0 }, { headers: noCacheHeaders() });
  }

  const count = await prisma.message.count({
    where: { senderType: "CLIENT", readAt: null },
  });

  return NextResponse.json({ count }, { headers: noCacheHeaders() });
}
