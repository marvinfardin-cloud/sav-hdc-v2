import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { noCacheHeaders } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401, headers: noCacheHeaders() });
  }

  const { searchParams } = request.nextUrl;
  const dateStr = searchParams.get("date");
  const view = searchParams.get("view") || "week";

  let startDate: Date;
  let endDate: Date;

  if (dateStr) {
    startDate = new Date(dateStr);
    startDate.setHours(0, 0, 0, 0);
  } else {
    startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
  }

  if (view === "day") {
    endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
  } else {
    // Week view - start from Monday
    const day = startDate.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    startDate.setDate(startDate.getDate() + diff);
    endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
  }

  const rdvs = await prisma.rendezVous.findMany({
    where: {
      dateHeure: { gte: startDate, lt: endDate },
    },
    orderBy: { dateHeure: "asc" },
    include: { client: true },
  });

  return NextResponse.json(
    { rdvs, startDate, endDate },
    { headers: noCacheHeaders() }
  );
}
