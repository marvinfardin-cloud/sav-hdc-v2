import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function redactUrl(url: string | undefined): string {
  if (!url) return "(not set)";
  try {
    const u = new URL(url);
    u.password = "***";
    return u.toString();
  } catch {
    return "(invalid URL)";
  }
}

export async function GET() {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      latencyMs: Date.now() - start,
      databaseUrl: redactUrl(process.env.DATABASE_URL),
      directUrl: redactUrl(process.env.DIRECT_URL),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        ok: false,
        error: message.replace(/:[^@]*@/g, ":***@"),
        databaseUrl: redactUrl(process.env.DATABASE_URL),
        directUrl: redactUrl(process.env.DIRECT_URL),
      },
      { status: 500 }
    );
  }
}
