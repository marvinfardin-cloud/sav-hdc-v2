import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { noCacheHeaders } from "@/lib/utils";

// Available hours: 07:00-12:00 and 13:00-16:00, 30min slots
const MORNING_SLOTS = [7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5];
const AFTERNOON_SLOTS = [13, 13.5, 14, 14.5, 15, 15.5];

function decimalToTime(decimal: number): string {
  const hours = Math.floor(decimal);
  const minutes = (decimal % 1) * 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const dateStr = searchParams.get("date");

  if (!dateStr) {
    return NextResponse.json(
      { error: "Date requise" },
      { status: 400, headers: noCacheHeaders() }
    );
  }

  // Treat dateStr as a Martinique local date (UTC-4, no DST).
  // Build the day boundaries in Martinique time so the DB query is correct.
  const startOfDay = new Date(`${dateStr}T00:00:00-04:00`);
  const endOfDay   = new Date(`${dateStr}T23:59:59.999-04:00`);

  // Derive day-of-week from the Martinique date string to avoid UTC date shifting.
  const [y, mo, d] = dateStr.split("-").map(Number);
  const dayOfWeek = new Date(y, mo - 1, d).getDay();

  // No appointments on Sunday (0)
  if (dayOfWeek === 0) {
    return NextResponse.json({ slots: [] }, { headers: noCacheHeaders() });
  }

  // Saturday: morning only
  const allSlots = dayOfWeek === 6
    ? MORNING_SLOTS
    : [...MORNING_SLOTS, ...AFTERNOON_SLOTS];

  const existingRdvs = await prisma.rendezVous.findMany({
    where: {
      dateHeure: { gte: startOfDay, lte: endOfDay },
      statut: { not: "annule" },
    },
    select: { dateHeure: true },
  });

  // Martinique is UTC-4 with no DST — subtract 4 hours from stored UTC to get local hour.
  const bookedTimes = new Set(
    existingRdvs.map((rdv) => {
      const h = ((rdv.dateHeure.getUTCHours() - 4) + 24) % 24;
      const m = rdv.dateHeure.getUTCMinutes();
      return h + m / 60;
    })
  );

  const slots = allSlots.map((decimal) => ({
    time: decimalToTime(decimal),
    available: !bookedTimes.has(decimal),
  }));

  return NextResponse.json({ slots }, { headers: noCacheHeaders() });
}
