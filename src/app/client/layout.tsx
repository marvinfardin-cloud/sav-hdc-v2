import { redirect } from "next/navigation";
import { getClientSession } from "@/lib/auth";
import ClientNav from "./ClientNav";
import BottomNav from "./BottomNav";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getClientSession();
  if (!session?.client) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAFAF7" }}>
      <ClientNav clientName={`${session.client.prenom} ${session.client.nom}`} />
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
