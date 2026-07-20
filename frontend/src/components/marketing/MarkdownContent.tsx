import Link from "next/link";
import { Quote } from "lucide-react";
import type { ReactNode } from "react";

const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp|gif|bmp|avif|svg)$/i;

const isImageSource = (src: string) =>
  IMAGE_EXTENSIONS.test(src) || src.startsWith("/uploads/") || src.includes("/uploads/");

const renderInlineMarkdown = (text: string): ReactNode[] => {
  const nodes: ReactNode[] = [];
  const pattern =
    /(!?\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*|\*[^*\n]+\*|https?:\/\/[^\s<]+)(?=\s|$)/g;
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    const raw = match[0];
    const plain = text.slice(lastIndex, start);
    if (plain) nodes.push(plain);

    if (raw.startsWith("![") || raw.startsWith("[")) {
      const imageMatch = raw.match(/^!?\[([^\]]*)\]\(([^)]+)\)$/);
      if (imageMatch) {
        const alt = imageMatch[1];
        const src = imageMatch[2];
        if (raw.startsWith("![") && isImageSource(src)) {
          nodes.push(
            <figure
              key={`${start}-${raw}`}
              className="my-8 overflow-hidden rounded-sm border border-neutral-200 bg-neutral-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt || "Gambar artikel"}
                className="h-auto w-full object-contain"
              />
              {alt ? (
                <figcaption className="px-4 py-3 text-sm text-neutral-500">
                  {alt}
                </figcaption>
              ) : null}
            </figure>,
          );
        } else {
          nodes.push(
            <Link
              key={`${start}-${raw}`}
              href={src}
              className="font-semibold text-primary underline decoration-gold decoration-2 underline-offset-4 transition hover:text-gold"
              target={/^https?:\/\//i.test(src) ? "_blank" : undefined}
              rel={/^https?:\/\//i.test(src) ? "noreferrer" : undefined}
            >
              {alt || src}
            </Link>,
          );
        }
      } else {
        nodes.push(raw);
      }
    } else if (raw.startsWith("`")) {
      nodes.push(
        <code
          key={`${start}-${raw}`}
          className="rounded-sm bg-neutral-100 px-1.5 py-0.5 text-[0.95em] font-semibold text-primary"
        >
          {raw.slice(1, -1)}
        </code>,
      );
    } else if (raw.startsWith("**")) {
      nodes.push(
        <strong key={`${start}-${raw}`} className="font-extrabold text-primary">
          {raw.slice(2, -2)}
        </strong>,
      );
    } else if (raw.startsWith("*")) {
      nodes.push(
        <em key={`${start}-${raw}`} className="italic text-primary">
          {raw.slice(1, -1)}
        </em>,
      );
    } else {
      nodes.push(
        <a
          key={`${start}-${raw}`}
          href={raw}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-primary underline decoration-gold decoration-2 underline-offset-4 transition hover:text-gold"
        >
          {raw}
        </a>,
      );
    }

    lastIndex = start + raw.length;
  }

  const tail = text.slice(lastIndex);
  if (tail) nodes.push(tail);

  return nodes;
};

const renderImageBlock = (alt: string, src: string, key: string) => (
  <figure
    key={key}
    className="my-8 overflow-hidden rounded-sm border border-neutral-200 bg-neutral-50"
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={src}
      alt={alt || "Gambar artikel"}
      className="h-auto w-full object-contain"
    />
    {alt ? (
      <figcaption className="px-4 py-3 text-sm text-neutral-500">
        {alt}
      </figcaption>
    ) : null}
  </figure>
);

export const renderMarkdownContent = (content: string) => {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraphBuffer: string[] = [];

  const flushParagraph = () => {
    if (!paragraphBuffer.length) return;
    const text = paragraphBuffer.join(" ").replace(/\s+/g, " ").trim();
    paragraphBuffer = [];
    if (!text) return;
    blocks.push(
      <p key={`p-${blocks.length}`} className="leading-8 text-neutral-700">
        {renderInlineMarkdown(text)}
      </p>,
    );
  };

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      continue;
    }

    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      const level = heading[1].length;
      const HeadingTag = level === 2 ? "h2" : "h3";
      blocks.push(
        <HeadingTag
          key={`h-${index}`}
          className={
            level === 2
              ? "pt-4 text-2xl font-extrabold text-primary"
              : "pt-2 text-xl font-extrabold text-primary"
          }
        >
          {renderInlineMarkdown(heading[2].trim())}
        </HeadingTag>,
      );
      continue;
    }

    const blockquote = line.match(/^>\s+(.+)$/);
    if (blockquote) {
      flushParagraph();
      const quoteLines = [blockquote[1]];
      while (index + 1 < lines.length && lines[index + 1].trim().startsWith(">")) {
        index += 1;
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
      }
      blocks.push(
        <blockquote
          key={`quote-${index}`}
          className="border-l-4 border-gold bg-gold/8 px-5 py-4 text-primary"
        >
          <Quote className="mb-2 h-5 w-5 text-gold" />
          <p className="text-lg font-semibold leading-8">
            {renderInlineMarkdown(quoteLines.join(" ").trim())}
          </p>
        </blockquote>,
      );
      continue;
    }

    const image = line.match(/^!?\[([^\]]*)\]\(([^)]+)\)$/);
    if (image && isImageSource(image[2])) {
      flushParagraph();
      blocks.push(renderImageBlock(image[1], image[2], `img-${index}`));
      continue;
    }

    const unordered = line.match(/^([-*•])\s+(.+)$/);
    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const items: string[] = [];
      let cursor = index;
      while (cursor < lines.length) {
        const current = lines[cursor].trim();
        if (!current) break;
        const currentUnordered = current.match(/^([-*•])\s+(.+)$/);
        const currentOrdered = current.match(/^\d+\.\s+(.+)$/);
        if (!currentUnordered && !currentOrdered) break;
        items.push((currentUnordered?.[2] || currentOrdered?.[1] || "").trim());
        cursor += 1;
      }
      index = cursor - 1;
      const orderedList = Boolean(ordered);
      const ListTag = orderedList ? "ol" : "ul";
      blocks.push(
        <ListTag key={`list-${index}`} className={orderedList ? "space-y-3 pl-5" : "space-y-3"}>
          {items.map((item, itemIndex) => (
            <li
              key={`${index}-${itemIndex}-${item}`}
              className={orderedList ? "list-decimal leading-7 text-neutral-700" : "leading-7 text-neutral-700"}
            >
              <div className="flex gap-3 rounded-sm bg-primary/5 px-4 py-3">
                {!orderedList ? (
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-gold" />
                ) : null}
                <span>{renderInlineMarkdown(item)}</span>
              </div>
            </li>
          ))}
        </ListTag>,
      );
      continue;
    }

    paragraphBuffer.push(rawLine);
  }

  flushParagraph();
  return blocks;
};
