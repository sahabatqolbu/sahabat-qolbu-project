"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bold,
  Eye,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getImageUrl } from "@/lib/utils";

type EditorAction =
  | "paragraph"
  | "h2"
  | "h3"
  | "bold"
  | "italic"
  | "unordered"
  | "ordered"
  | "quote"
  | "link"
  | "rule";

interface ArticleMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

const toolbarItems = [
  { action: "paragraph" as const, label: "Paragraf", icon: Pilcrow },
  { action: "h2" as const, label: "Heading 2", icon: Heading2 },
  { action: "h3" as const, label: "Heading 3", icon: Heading3 },
  { action: "bold" as const, label: "Tebal (Ctrl+B)", icon: Bold },
  { action: "italic" as const, label: "Miring (Ctrl+I)", icon: Italic },
  { action: "unordered" as const, label: "Daftar poin", icon: List },
  { action: "ordered" as const, label: "Daftar nomor", icon: ListOrdered },
  { action: "quote" as const, label: "Kutipan", icon: Quote },
  { action: "link" as const, label: "Tautan", icon: Link2 },
  { action: "rule" as const, label: "Garis pemisah", icon: Minus },
];

const prefixLines = (text: string, prefix: string) =>
  text
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");

export default function ArticleMarkdownEditor({
  value,
  onChange,
  textareaRef,
}: ArticleMarkdownEditorProps) {
  const editorRef = textareaRef;
  const [view, setView] = useState<"write" | "preview">("write");

  const stats = useMemo(() => {
    const words = value.trim() ? value.trim().split(/\s+/).length : 0;
    return { words, minutes: Math.max(1, Math.ceil(words / 200)) };
  }, [value]);

  const replaceSelection = (
    replacement: string,
    selectionStart: number,
    selectionEnd: number,
  ) => {
    const element = editorRef.current;
    if (!element) return;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    onChange(`${value.slice(0, start)}${replacement}${value.slice(end)}`);
    requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(start + selectionStart, start + selectionEnd);
    });
  };

  const applyFormat = (action: EditorAction) => {
    const element = editorRef.current;
    if (!element) return;
    const selected = value.slice(element.selectionStart, element.selectionEnd);
    const fallback = selected || "Tulis teks di sini";

    if (action === "bold") {
      replaceSelection(`**${fallback}**`, 2, fallback.length + 2);
    } else if (action === "italic") {
      replaceSelection(`*${fallback}*`, 1, fallback.length + 1);
    } else if (action === "link") {
      replaceSelection(`[${fallback}](https://)`, 1, fallback.length + 1);
    } else if (action === "h2" || action === "h3") {
      const prefix = action === "h2" ? "## " : "### ";
      const next = `${prefix}${fallback.replace(/^#+\s*/, "")}`;
      replaceSelection(next, prefix.length, next.length);
    } else if (action === "paragraph") {
      const next = fallback.replace(/^([#>]|\d+\.|[-*])\s*/, "");
      replaceSelection(next, 0, next.length);
    } else if (action === "unordered" || action === "quote") {
      const prefix = action === "unordered" ? "- " : "> ";
      const next = prefixLines(fallback, prefix);
      replaceSelection(next, prefix.length, next.length);
    } else if (action === "ordered") {
      const next = fallback
        .split("\n")
        .map((line, index) => `${index + 1}. ${line}`)
        .join("\n");
      replaceSelection(next, 3, next.length);
    } else {
      replaceSelection("\n\n---\n\n", 7, 7);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1">
          {toolbarItems.map(({ action, label, icon: Icon }) => (
            <button
              key={action}
              type="button"
              title={label}
              aria-label={label}
              onClick={() => applyFormat(action)}
              disabled={view === "preview"}
              className="grid h-9 min-w-9 place-items-center rounded-md px-2 text-slate-600 transition hover:bg-white hover:text-primary hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 self-start rounded-md border bg-white p-1 lg:self-auto">
          <Button
            type="button"
            size="sm"
            variant={view === "write" ? "default" : "ghost"}
            className="h-8"
            onClick={() => setView("write")}
          >
            <Pilcrow className="mr-1.5 h-4 w-4" /> Tulis
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === "preview" ? "default" : "ghost"}
            className="h-8"
            onClick={() => setView("preview")}
          >
            <Eye className="mr-1.5 h-4 w-4" /> Preview
          </Button>
        </div>
      </div>

      {view === "write" ? (
        <Textarea
          ref={editorRef}
          rows={26}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (
              (event.ctrlKey || event.metaKey) &&
              event.key.toLowerCase() === "b"
            ) {
              event.preventDefault();
              applyFormat("bold");
            }
            if (
              (event.ctrlKey || event.metaKey) &&
              event.key.toLowerCase() === "i"
            ) {
              event.preventDefault();
              applyFormat("italic");
            }
          }}
          required
          className="min-h-[620px] resize-y rounded-none border-0 px-5 py-5 font-mono text-[15px] leading-7 shadow-none focus-visible:ring-0"
          placeholder={
            "Mulai dengan pembuka yang menarik...\n\n## Judul bagian\n\nTulis paragraf singkat dan jelas.\n\n- Poin pertama\n- Poin kedua"
          }
        />
      ) : (
        <div className="min-h-[620px] bg-[#fbfcfb] px-5 py-7 md:px-10">
          {value.trim() ? (
            <article className="mx-auto max-w-3xl text-slate-700">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h2 className="mb-4 mt-9 text-3xl font-bold text-primary first:mt-0">
                      {children}
                    </h2>
                  ),
                  h2: ({ children }) => (
                    <h2 className="mb-4 mt-9 border-b border-amber-200 pb-3 text-2xl font-bold text-primary first:mt-0">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="mb-3 mt-7 text-xl font-bold text-primary">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="my-4 leading-8">{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-extrabold text-primary">
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-slate-800">{children}</em>
                  ),
                  ul: ({ children }) => (
                    <ul className="my-5 list-disc space-y-2 pl-6 marker:text-amber-500">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="my-5 list-decimal space-y-2 pl-6 marker:font-bold marker:text-amber-500">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="pl-1 leading-7">{children}</li>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="my-6 border-l-4 border-amber-400 bg-amber-50 px-5 py-3 font-medium text-primary">
                      {children}
                    </blockquote>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      className="font-bold text-primary underline decoration-amber-400 decoration-2 underline-offset-4"
                    >
                      {children}
                    </a>
                  ),
                  img: ({ src, alt }) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getImageUrl(typeof src === "string" ? src : "")}
                      alt={alt || "Gambar artikel"}
                      className="my-7 h-auto max-h-[600px] w-full rounded-md border object-contain"
                    />
                  ),
                  hr: () => <hr className="my-8 border-amber-200" />,
                  table: ({ children }) => (
                    <table className="my-6 min-w-full border-collapse overflow-hidden rounded-md border text-sm">
                      {children}
                    </table>
                  ),
                  th: ({ children }) => (
                    <th className="bg-primary px-3 py-2 text-left text-white">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border px-3 py-2 align-top">{children}</td>
                  ),
                }}
              >
                {value}
              </ReactMarkdown>
            </article>
          ) : (
            <div className="grid min-h-[520px] place-items-center text-center text-slate-400">
              <div>
                <Eye className="mx-auto mb-3 h-8 w-8" />
                <p className="font-medium">
                  Preview akan tampil setelah konten ditulis.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-slate-50 px-4 py-2 text-xs text-slate-500">
        <span>
          Gunakan Heading 2 untuk bagian utama dan Heading 3 untuk subbagian.
        </span>
        <span className="font-medium tabular-nums">
          {stats.words.toLocaleString("id-ID")} kata · ±{stats.minutes} menit
          baca
        </span>
      </div>
    </div>
  );
}
