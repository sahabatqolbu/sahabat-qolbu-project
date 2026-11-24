import { redirect } from "next/navigation";

export default function DaftarPage() {
  redirect("/login?tab=register");
}
