"use client";

import { Fragment, useMemo, useState, type ReactNode } from "react";
import type { PublicFaq } from "@/lib/public-api";
import { WaLink } from "./chrome";
import { IconCard, IconDoc, IconPassport, IconPlus, IconSearch, IconSyringe, IconUsers } from "./icons";

const TOPICS = [
  { id: "daftar", label: "Pendaftaran", Icon: IconDoc },
  { id: "paspor", label: "Paspor", Icon: IconPassport },
  { id: "vaksin", label: "Vaksin", Icon: IconSyringe },
  { id: "bayar", label: "Pembayaran", Icon: IconCard },
  { id: "umum", label: "Umum", Icon: IconUsers },
];

const topicOf = (faq: PublicFaq) => {
  const text = `${faq.question} ${faq.category || ""}`;
  if (/paspor|passport/i.test(text)) return "paspor";
  if (/vaksin|meningitis|kkp|polio/i.test(text)) return "vaksin";
  if (/PAYMENT/i.test(faq.category || "") || /bayar|rekening|biaya|dp\b/i.test(faq.question)) return "bayar";
  if (/GENERAL/i.test(faq.category || "")) return "umum";
  return "daftar";
};

const URL_SPLIT = /(https?:\/\/[^\s)]+)/g;
const IS_URL = /^https?:\/\//;

/** Menyorot kata yang dicari dan mengubah URL menjadi link, tanpa menyisipkan HTML. */
function Rich({ text, query }: { text: string; query: string }) {
  const parts = text.split(URL_SPLIT);
  return (
    <>
      {parts.map((part, i) => {
        if (IS_URL.test(part)) {
          return (
            <a key={i} href={part} target="_blank" rel="noopener noreferrer">
              {part.replace(/^https?:\/\//, "").slice(0, 44)}
              {part.length > 52 ? "..." : ""}
            </a>
          );
        }
        if (!query) return <Fragment key={i}>{part}</Fragment>;
        const lower = part.toLowerCase();
        const q = query.toLowerCase();
        const out: ReactNode[] = [];
        let from = 0;
        let at = lower.indexOf(q);
        while (at >= 0) {
          out.push(part.slice(from, at), <mark key={`${i}-${at}`}>{part.slice(at, at + q.length)}</mark>);
          from = at + q.length;
          at = lower.indexOf(q, from);
        }
        out.push(part.slice(from));
        return <Fragment key={i}>{out}</Fragment>;
      })}
    </>
  );
}

export default function FaqExplorer({ faqs, aside }: { faqs: PublicFaq[]; aside: ReactNode }) {
  const [topic, setTopic] = useState("all");
  const [query, setQuery] = useState("");
  const items = useMemo(() => faqs.map((f) => ({ ...f, topic: topicOf(f) })), [faqs]);
  const q = query.trim();
  const list = items.filter(
    (f) => (topic === "all" || f.topic === topic) && (!q || `${f.question} ${f.answer}`.toLowerCase().includes(q.toLowerCase())),
  );
  const groups = TOPICS.filter((t) => list.some((f) => f.topic === t.id));

  return (
    <>
      <div className="finder" style={{ marginTop: -62 }}>
        <div className="wrap">
          <form className="search" role="search" onSubmit={(e) => e.preventDefault()} style={{ maxWidth: 640 }}>
            <IconSearch />
            <label htmlFor="faq-cari" className="sr-only">Cari pertanyaan</label>
            <input id="faq-cari" type="search" placeholder="Cari: paspor, DP, vaksin" value={query} onChange={(e) => setQuery(e.target.value)} />
          </form>
        </div>
      </div>
      <section className="sec" style={{ paddingTop: 40 }}>
        <div className="wrap">
          <div className="topics" role="group" aria-label="Pilih topik">
            {TOPICS.map(({ id, label, Icon }) => {
              const count = items.filter((f) => f.topic === id).length;
              if (!count) return null;
              return (
                <button key={id} className="topic" type="button" aria-pressed={topic === id} onClick={() => setTopic(topic === id ? "all" : id)}>
                  <i><Icon /></i>
                  <b>{label}</b>
                  <small>{count} pertanyaan</small>
                </button>
              );
            })}
          </div>
          <div className="layout" style={{ marginTop: 44 }}>
            <div aria-live="polite">
              {list.length ? (
                groups.map((group, g) => (
                  <div className="grp" key={group.id}>
                    <h2>{group.label}</h2>
                    {list
                      .filter((f) => f.topic === group.id)
                      .map((f, i) => (
                        <details key={f.id} open={Boolean(q) || (g === 0 && i === 0)}>
                          <summary>
                            <span><Rich text={f.question} query={q} /></span>
                            <IconPlus className="" width={20} height={20} />
                          </summary>
                          <p className="ans"><Rich text={f.answer} query={q} /></p>
                        </details>
                      ))}
                  </div>
                ))
              ) : (
                <div className="empty">
                  <b>Belum ada jawaban untuk &quot;{q}&quot;</b>
                  Tanyakan langsung ke admin, biasanya dibalas di hari yang sama.
                  <div style={{ marginTop: 18 }}>
                    <WaLink className="btn btn-gold" message={`Assalamualaikum, saya ingin bertanya: ${q}`}>Tanya admin</WaLink>
                  </div>
                </div>
              )}
            </div>
            {aside}
          </div>
        </div>
      </section>
    </>
  );
}
