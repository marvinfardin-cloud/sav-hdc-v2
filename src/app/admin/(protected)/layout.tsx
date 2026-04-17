import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session?.user) {
    redirect("/admin/login");
  }

  return (
    <AdminShell userName={session.user.nom} userRole={session.user.role}>
      {children}
    </AdminShell>
  );
}
