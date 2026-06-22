import { readFile } from "node:fs/promises";
import path from "node:path";
import LandingScriptRunner from "./LandingScriptRunner";
import { getDashboardBaseUrl } from "@/lib/dashboard-url";

type StaticLandingHtmlProps = {
  fileName: "index.html" | "paket.html";
};

const scriptlessHtml = (html: string, fileName: StaticLandingHtmlProps["fileName"]) => {
  const dashboardUrl = getDashboardBaseUrl();

  let transformed = html
    .replace(/^[\s\S]*?<body[^>]*>/i, "")
    .replace(/<\/body>[\s\S]*$/i, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/__DASHBOARD_URL__/g, dashboardUrl)
    .replace(/\s(?:id)="logo(Sahabat|Qolbu|Tagline)"/g, "")
    .replace(/href="\/landing\/#([^"]+)"/g, 'href="/#$1"')
    .replace(/href="\/landing\/paket"/g, 'href="/paket"')
    .replace(/href="\/landing\/"/g, 'href="/"')
    .replace(/href="#beranda"/g, 'href="/#beranda"')
    .replace(/href="#tentang"/g, 'href="/#tentang"')
    .replace(/href="#testimoni"/g, 'href="/#testimoni"')
    .replace(/href="\.\//g, 'href="/landing/')
    .replace(/src="\.\//g, 'src="/landing/')
    .replace(/src="images\//g, 'src="/landing/images/');

  if (fileName === "paket.html") {
    transformed = transformed.replace(/href="#paket"/g, 'href="/paket"');
  }

  return transformed;
};

export default async function StaticLandingHtml({
  fileName,
}: StaticLandingHtmlProps) {
  const filePath = path.join(process.cwd(), "public", "landing", fileName);
  const html = scriptlessHtml(await readFile(filePath, "utf8"), fileName);

  return (
    <div className="landing-static">
      <div dangerouslySetInnerHTML={{ __html: html }} />

      <LandingScriptRunner />
    </div>
  );
}
