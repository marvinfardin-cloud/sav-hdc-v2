import { getAdminSession } from "@/lib/auth";
import DashboardClient from "../DashboardClient";

export default async function AdminDashboard() {
  const session = await getAdminSession();
  return <DashboardClient userName={session?.user?.nom ?? ""} />;
}
