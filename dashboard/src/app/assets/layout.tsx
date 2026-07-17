import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AuthStoreHydrator } from "@/components/auth/AuthStoreHydrator";
import AssetShell from "@/components/assets/AssetShell";
import { DEFAULT_ROUTES } from "@/lib/routeAccess";
import { sessionToAuthUser, validateSession } from "@/lib/validateSession";

export default async function AssetLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const session = await validateSession(token);

  if (!session) redirect("/login?redirect=/assets");
  if (session.role !== "ADMIN" && session.role !== "STAFF") {
    redirect(DEFAULT_ROUTES[session.role]);
  }

  const user = sessionToAuthUser(session);

  return (
    <>
      <AuthStoreHydrator user={user} />
      <AssetShell user={user}>{children}</AssetShell>
    </>
  );
}