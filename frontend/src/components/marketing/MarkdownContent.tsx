import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Quote } from "lucide-react";
import { resolveAssetUrl } from "@/lib/public-api";

const resolveArticleImageUrl = (src?: string | Blob) =>
  typeof src === "string" ? resolveAssetUrl(src) || src : "";

const isExternalUrl = (href?: string) => /^https?:\/\//i.test(href || "");

export function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h2 className="mt-12 scroll-mt-28 text-3xl font-extrabold leading-tight text-primary first:mt-0 md:text-4xl">
            {children}
          </h2>
        ),
        h2: ({ children }) => (
          <h2 className="mt-12 scroll-mt-28 border-b border-gold/30 pb-3 text-2xl font-extrabold leading-tight text-primary first:mt-0 md:text-3xl">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mt-9 scroll-mt-28 text-xl font-extrabold leading-snug text-primary md:text-2xl">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="mt-7 text-lg font-extrabold leading-snug text-primary">
            {children}
          </h4>
        ),
        p: ({ children }) => (
          <p className="my-5 text-[1.04rem] leading-8 text-neutral-700 md:text-[1.075rem] md:leading-9">
            {children}
          </p>
        ),
        strong: ({ children }) => (
          <strong className="font-extrabold text-primary">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="font-medium italic text-neutral-800">{children}</em>
        ),
        ul: ({ children }) => (
          <ul className="my-6 list-disc space-y-3 pl-7 marker:text-gold">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="my-6 list-decimal space-y-3 pl-7 marker:font-extrabold marker:text-gold">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="pl-1 text-[1.02rem] leading-8 text-neutral-700 [&>p]:my-0">
            {children}
          </li>
        ),
        blockquote: ({ children }) => (
          <blockquote className="relative my-9 border-l-4 border-gold bg-[#f7f3e8] px-6 py-5 text-primary md:px-8">
            <Quote className="mb-2 h-6 w-6 text-gold" />
            <div className="font-semibold [&>p]:my-0 [&>p]:text-primary">
              {children}
            </div>
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target={isExternalUrl(href) ? "_blank" : undefined}
            rel={isExternalUrl(href) ? "noreferrer noopener" : undefined}
            className="font-bold text-primary underline decoration-gold decoration-2 underline-offset-4 transition hover:text-gold"
          >
            {children}
          </a>
        ),
        img: ({ src, alt }) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveArticleImageUrl(src)}
            alt={alt || "Gambar artikel"}
            loading="lazy"
            className="my-9 h-auto max-h-[720px] w-full rounded-md border border-neutral-200 bg-neutral-50 object-contain shadow-sm"
          />
        ),
        hr: () => <hr className="my-10 border-0 border-t border-gold/40" />,
        code: ({ children }) => (
          <code className="rounded bg-primary/8 px-1.5 py-0.5 font-mono text-[0.92em] font-semibold text-primary">
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="my-7 overflow-x-auto rounded-md bg-primary p-5 text-sm leading-7 text-white shadow-sm [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-white">
            {children}
          </pre>
        ),
        table: ({ children }) => (
          <div className="my-8 overflow-x-auto rounded-md border border-neutral-200">
            <table className="min-w-full border-collapse text-left text-sm">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-primary text-white">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="border-b border-white/20 px-4 py-3 font-bold">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border-b border-neutral-200 px-4 py-3 align-top leading-6 text-neutral-700">
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export const renderMarkdownContent = (content: string) => (
  <MarkdownContent content={content} />
);
