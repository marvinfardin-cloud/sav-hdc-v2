import { NextResponse } from "next/server";
import { getClientSession } from "@/lib/auth";
import { noCacheHeaders } from "@/lib/utils";

export async function GET() {
  const session = await getClientSession();
  if (!session?.client) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401, headers: noCacheHeaders() });
  }
  const { prenom, nom, email, telephone } = session.client;
  return NextResponse.json(
    { prenom, nom, email, telephone },
    { headers: noCacheHeaders() }
  );
}
