import { readFile } from "node:fs/promises";
import path from "node:path";
import LandingScriptRunner from "./LandingScriptRunner";

type StaticLandingHtmlProps = {
  fileName: "index.html" | "paket.html";
};

const scriptlessHtml = (html: string) =>
  html
    .replace(/^[\s\S]*?<body[^>]*>/i, "")
    .replace(/<\/body>[\s\S]*$/i, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\s(?:id)="logo(Sahabat|Qolbu|Tagline)"/g, "")
    .replace(/href="\/landing\/#([^"]+)"/g, 'href="/#$1"')
    .replace(/href="\/landing\/paket"/g, 'href="/paket"')
    .replace(/href="\/landing\/"/g, 'href="/"')
    .replace(/href="#paket"/g, 'href="/paket"')
    .replace(/href="#beranda"/g, 'href="/#beranda"')
    .replace(/href="#tentang"/g, 'href="/#tentang"')
    .replace(/href="#testimoni"/g, 'href="/#testimoni"')
    .replace(/href="\.\//g, 'href="/landing/')
    .replace(/src="\.\//g, 'src="/landing/')
    .replace(/src="images\//g, 'src="/landing/images/');

export default async function StaticLandingHtml({
  fileName,
}: StaticLandingHtmlProps) {
  const filePath = path.join(process.cwd(), "public", "landing", fileName);
  const html = scriptlessHtml(await readFile(filePath, "utf8"));

  return (
    <div className="landing-static">
      <div dangerouslySetInnerHTML={{ __html: html }} />

      <LandingScriptRunner />
      <script
        id={`landing-behavior-${fileName}`}
        dangerouslySetInnerHTML={{
          __html: `
          (function () {
            const mobileMenuBtn = document.getElementById('mobileMenuBtn');
            const mobileMenu = document.getElementById('mobileMenu');
            const header = document.getElementById('header');

            if (mobileMenuBtn && mobileMenu && !mobileMenuBtn.dataset.bound) {
              mobileMenuBtn.dataset.bound = 'true';
              mobileMenuBtn.addEventListener('click', function () {
                const isOpen = !mobileMenu.classList.contains('hidden');
                mobileMenu.classList.toggle('hidden');
                mobileMenuBtn.setAttribute('aria-expanded', String(!isOpen));
              });

              mobileMenu.querySelectorAll('a').forEach(function (link) {
                link.addEventListener('click', function () {
                  mobileMenu.classList.add('hidden');
                  mobileMenuBtn.setAttribute('aria-expanded', 'false');
                });
              });
            }

            function updateHeader() {
              if (!header || !header.classList.contains('fixed')) return;
              if (window.scrollY > 50) {
                header.classList.add('bg-primary', 'shadow-lg');
              } else {
                header.classList.remove('bg-primary', 'shadow-lg');
              }
            }

            updateHeader();
            window.addEventListener('scroll', updateHeader, { passive: true });
          })();
        `,
        }}
      />
    </div>
  );
}
