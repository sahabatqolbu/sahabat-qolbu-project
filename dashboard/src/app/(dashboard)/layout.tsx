import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { AuthStoreHydrator } from "@/components/auth/AuthStoreHydrator";
import { DEFAULT_ROUTES } from "@/lib/routeAccess";
import { sessionToAuthUser, validateSession } from "@/lib/validateSession";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const session = await validateSession(token);

  if (!session) {
    redirect("/login");
  }

  if (session.role === "AGEN" || session.role === "JAMAAH") {
    redirect(DEFAULT_ROUTES[session.role]);
  }

  const user = sessionToAuthUser(session);

  return (
    <>
      <AuthStoreHydrator user={user} />
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="md:pl-64 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">{children}</main>
        </div>
        <BottomNav />
      </div>
    </>
  );
}
