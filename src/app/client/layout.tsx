import { redirect } from "next/navigation";
import { getClientSession } from "@/lib/auth";
import ClientNav from "./ClientNav";

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
    <div className="min-h-screen bg-gray-50">
      <ClientNav clientName={`${session.client.prenom} ${session.client.nom}`} />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
