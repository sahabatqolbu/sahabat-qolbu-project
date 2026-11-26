import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ReactNode } from "react";
import { resolveAssetUrl } from "@/lib/public-api";

const ARABIC = /[؀-ۿ]/;

const textOf = (node: ReactNode): string => {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) {
    return textOf((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
};

export const headingSlug = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

/** Markdown artikel dan deskripsi dengan gaya .prose; ayat Arab tampil kanan-ke-kiri. */
export default function Markdown({ content, headingIds = false }: { content: string; headingIds?: boolean }) {
  const slug = (children: ReactNode) => (headingIds ? headingSlug(textOf(children)) : undefined);
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h2 id={slug(children)}>{children}</h2>,
        h2: ({ children }) => <h2 id={slug(children)}>{children}</h2>,
        h3: ({ children }) => <h3 id={slug(children)}>{children}</h3>,
        p: ({ children }) => {
          const text = textOf(children);
          const arabic = ARABIC.test(text) && text.replace(/[\s؀-ۿ.,:;"'()]/g, "").length < text.length * 0.2;
          return arabic ? (
            <span className="ar" lang="ar" dir="rtl">{children}</span>
          ) : (
            <p>{children}</p>
          );
        },
        a: ({ href, children }) => {
          const external = /^https?:\/\//i.test(href || "");
          return (
            <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              {children}
            </a>
          );
        },
        img: ({ src, alt }) =>
          typeof src === "string" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolveAssetUrl(src) || src} alt={alt || ""} loading="lazy" style={{ borderRadius: 18, margin: "18px 0" }} />
          ) : null,
        table: ({ children }) => (
          <div className="scroll" style={{ margin: "18px 0" }}>
            <table className="tbl">{children}</table>
          </div>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
