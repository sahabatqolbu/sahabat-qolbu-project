import { redirect } from "next/navigation";
import { getDashboardBaseUrl } from "@/lib/dashboard-url";

export default function DaftarPage() {
  redirect(`${getDashboardBaseUrl()}/daftar-paket`);
}
