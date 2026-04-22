import { NextResponse } from "next/server";
import { getClientSession } from "@/lib/auth";
import { noCacheHeaders } from "@/lib/utils";

export async function GET() {
  const session = await getClientSession();
  if (!session?.client) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401, headers: noCacheHeaders() });
  }
  return NextResponse.json(
    { prenom: session.client.prenom, nom: session.client.nom },
    { headers: noCacheHeaders() }
  );
}
