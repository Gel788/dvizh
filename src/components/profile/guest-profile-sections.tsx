"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { copyMediaItemAction } from "@/lib/social-actions";
import { reserveWishlistItemAction } from "@/lib/social-actions";

const STATUS_LABEL: Record<string, string> = {
  WANT: "хочу", IN_PROGRESS: "в процессе", DONE: "завершено",
};

const EMOJI: Record<string, string> = { FILM: "🎬", SERIES: "📺", BOOK: "📚", GAME: "🎮" };

type MediaItem = {
  id: string;
  title: string;
  type: string;
  status: string;
  rating: number | null;
  review: string | null;
};

export function GuestMediaSection({ media, isSelf }: { media: MediaItem[]; isSelf: boolean }) {
  const [, startTransition] = useTransition();
  if (media.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="font-heading font-bold text-lg">Медиалист</h2>
      {media.slice(0, 6).map((m) => (
        <div key={m.id} className="card-surface flex items-center gap-3 p-3">
          <span className="text-xl">{EMOJI[m.type] ?? "🎬"}</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">{m.title}</p>
            <p className="text-xs text-muted-foreground">{STATUS_LABEL[m.status] ?? m.status}</p>
            {m.rating && <p className="text-[#FFB020] text-xs">{"★".repeat(m.rating)}</p>}
          </div>
          {!isSelf && (
            <button
              type="button"
              onClick={() => startTransition(async () => {
                try {
                  await copyMediaItemAction(m.id);
                  toast.success("Добавлено в твой медиалист");
                } catch {
                  toast.error("Не удалось скопировать");
                }
              })}
              className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-ice/10 text-ice border border-ice/20 cursor-pointer shrink-0"
            >
              Забрать
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

type Achievement = {
  slug: string;
  name: string;
  icon: string;
  color: string;
};

export function GuestAchievementsSection({ achievements }: { achievements: Achievement[] }) {
  if (achievements.length === 0) return null;
  return (
    <div className="space-y-3">
      <h2 className="font-heading font-bold text-lg">Ачивки</h2>
      <div className="grid grid-cols-2 gap-2">
        {achievements.slice(0, 8).map((a) => (
          <div key={a.slug} className="card-surface p-3 flex gap-2 items-center">
            <div className="w-9 h-9 rounded-lg grid place-items-center text-lg shrink-0" style={{ background: `${a.color}22` }}>
              {a.icon}
            </div>
            <p className="font-bold text-xs leading-tight">{a.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

type Challenge = { id: string; title: string; participants: number };

export function GuestChallengesSection({ challenges }: { challenges: Challenge[] }) {
  if (challenges.length === 0) return null;
  return (
    <div className="space-y-3">
      <h2 className="font-heading font-bold text-lg">Вызовы</h2>
      {challenges.map((c) => (
        <Link key={c.id} href={`/post/${c.id}`} className="card-surface flex items-center justify-between p-3.5 hover:border-lime/30 transition-colors block">
          <p className="font-bold text-sm">{c.title}</p>
          <span className="text-xs text-muted-foreground shrink-0 ml-2">{c.participants} уч.</span>
        </Link>
      ))}
    </div>
  );
}
