"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Heart, MessageCircle, Send, Share2 } from "lucide-react";

interface LocalComment {
  name: string;
  message: string;
  createdAt: string;
}

interface ArticleEngagementProps {
  slug: string;
  title: string;
}

export default function ArticleEngagement({
  slug,
  title,
}: ArticleEngagementProps) {
  const storageKey = useMemo(() => `sq-article-${slug}`, [slug]);
  const savedState = useMemo(() => {
    if (typeof window === "undefined") {
      return { liked: false, likes: 0, comments: [] as LocalComment[] };
    }
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}") as {
        liked?: boolean;
        likes?: number;
        comments?: LocalComment[];
      };
      return {
        liked: Boolean(saved.liked),
        likes: Number(saved.likes || 0),
        comments: Array.isArray(saved.comments) ? saved.comments : [],
      };
    } catch {
      return { liked: false, likes: 0, comments: [] as LocalComment[] };
    }
  }, [storageKey]);

  const [liked, setLiked] = useState(savedState.liked);
  const [likes, setLikes] = useState(savedState.likes);
  const [comments, setComments] = useState<LocalComment[]>(
    savedState.comments,
  );
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const persist = (next: {
    liked?: boolean;
    likes?: number;
    comments?: LocalComment[];
  }) => {
    const payload = {
      liked,
      likes,
      comments,
      ...next,
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
  };

  const handleLike = () => {
    const nextLiked = !liked;
    const nextLikes = Math.max(0, likes + (nextLiked ? 1 : -1));
    setLiked(nextLiked);
    setLikes(nextLikes);
    persist({ liked: nextLiked, likes: nextLikes });
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      // User cancelled native share.
    }
  };

  const handleComment = (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedMessage = message.trim();
    if (!trimmedName || !trimmedMessage) return;

    const nextComments = [
      {
        name: trimmedName,
        message: trimmedMessage,
        createdAt: new Date().toISOString(),
      },
      ...comments,
    ];
    setComments(nextComments);
    setName("");
    setMessage("");
    persist({ comments: nextComments });
  };

  return (
    <section className="rounded-sm border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleLike}
          className={`inline-flex items-center gap-2 rounded-sm border px-4 py-2 font-bold transition ${
            liked
              ? "border-gold bg-gold text-primary"
              : "border-neutral-200 text-primary hover:border-gold"
          }`}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-primary" : ""}`} />
          Suka {likes ? `(${likes})` : ""}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-2 rounded-sm border border-neutral-200 px-4 py-2 font-bold text-primary transition hover:border-gold hover:text-gold"
        >
          <Share2 className="h-4 w-4" />
          {copied ? "Link disalin" : "Bagikan"}
        </button>
      </div>

      <div className="mt-6 border-t border-neutral-200 pt-5">
        <h2 className="flex items-center gap-2 text-xl font-extrabold text-primary">
          <MessageCircle className="h-5 w-5 text-gold" />
          Komentar
        </h2>
        <form onSubmit={handleComment} className="mt-4 space-y-3">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nama"
            className="w-full rounded-sm border border-neutral-200 px-4 py-3 outline-none transition focus:border-gold"
          />
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Tulis komentar singkat..."
            rows={3}
            className="w-full rounded-sm border border-neutral-200 px-4 py-3 outline-none transition focus:border-gold"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-3 font-bold text-white transition hover:bg-primary-700"
          >
            <Send className="h-4 w-4" />
            Kirim Komentar
          </button>
        </form>

        {comments.length ? (
          <div className="mt-5 space-y-3">
            {comments.map((comment, index) => (
              <div
                key={`${comment.createdAt}-${index}`}
                className="rounded-sm bg-neutral-50 p-4"
              >
                <p className="font-bold text-primary">{comment.name}</p>
                <p className="mt-1 text-sm leading-6 text-neutral-600">
                  {comment.message}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-neutral-500">
            Belum ada komentar di perangkat ini.
          </p>
        )}
      </div>
    </section>
  );
}
