import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { Sidebar } from "@/components/admin/Sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session?.user) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar userName={session.user.nom} userRole={session.user.role} />
      <div className="pl-64">
        <main className="p-8 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
