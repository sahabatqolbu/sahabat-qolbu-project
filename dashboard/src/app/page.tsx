import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { DEFAULT_ROUTES } from "@/lib/routeAccess";
import { validateSession } from "@/lib/validateSession";

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const session = await validateSession(token);

  if (!session) {
    redirect("/login");
  }

  redirect(DEFAULT_ROUTES[session.role]);
}
