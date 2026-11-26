"use client";

import { useState } from "react";
import { IconShare, IconWa } from "./icons";

export default function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Salin tautan ini", url);
    }
  };
  return (
    <div className="share">
      <a className="btn btn-wa" href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`} target="_blank" rel="noopener noreferrer">
        <IconWa />Bagikan ke WhatsApp
      </a>
      <button className="btn btn-line" type="button" onClick={copy}>
        <IconShare />{copied ? "Tautan disalin" : "Salin tautan"}
      </button>
    </div>
  );
}
