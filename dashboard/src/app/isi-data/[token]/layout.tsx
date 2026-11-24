import type { Metadata } from "next";

// The token lives in the URL, so never send it to other sites as a referrer.
export const metadata: Metadata = {
  title: "Isi Data Jamaah | Sahabat Qolbu",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default function DataLinkLayout({ children }: { children: React.ReactNode }) {
  return children;
}
