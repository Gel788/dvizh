"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { BookOpen, Clapperboard, Gift, Heart, Target, Trophy, Users, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { FeedReactions } from "./feed-reactions";
import { tagColor } from "@/components/profile/profile-data";
import { CopyMediaButton } from "./copy-media-button";
import { cheerActivityAction } from "@/lib/social-actions";

type Activity = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  xpGained: number | null;
  taskId: string | null;
  metadata: string | null;
  createdAt: Date;
  user: { id: string; name: string; username: string; avatar: string | null; verified: boolean };
};

const TYPE_META: Record<string, { label: string; act: string; icon: typeof Zap; className: string }> = {
  TASK_COMPLETED: { label: "Дневник", act: "выполнил задачу", icon: BookOpen, className: "text-lime bg-lime/10" },
  TASK_PROOF: { label: "Пруф", act: "добавил фото-пруф", icon: BookOpen, className: "text-lime bg-lime/10" },
  TASK_CREATED: { label: "Задача", act: "создал задачу", icon: BookOpen, className: "text-ice bg-ice/10" },
  CHALLENGE_JOINED: { label: "Челлендж", act: "присоединился к челленджу", icon: Target, className: "text-heat bg-heat/10" },
  CHALLENGE_CREATED: { label: "Челлендж", act: "запустил челлендж", icon: Target, className: "text-heat bg-heat/10" },
  ACHIEVEMENT_UNLOCKED: { label: "Ачивка", act: "получил ачивку", icon: Trophy, className: "text-good bg-good/10" },
  EVENT_ATTENDED: { label: "Событие", act: "посетил событие", icon: Zap, className: "text-ice bg-ice/10" },
  DUEL_MARKED: { label: "Спор", act: "отметился в споре", icon: Target, className: "text-heat bg-heat/10" },
  DUEL_STARTED: { label: "Спор", act: "запустил спор", icon: Target, className: "text-heat bg-heat/10" },
  MEDIA_ADDED: { label: "Медиалист", act: "добавил в медиалист", icon: Clapperboard, className: "text-ice bg-ice/10" },
  WISHLIST_ADDED: { label: "Вишлист", act: "обновил вишлист", icon: Gift, className: "text-good bg-good/10" },
  SHARED_GOAL_UPDATED: { label: "Вместе", act: "отметил пункт в списке", icon: Users, className: "text-lime bg-lime/10" },
};

function parseTag(body: string | null) {
  if (!body?.startsWith("#")) return null;
  return body.slice(1).split(/\s/)[0];
}

function parseMeta(metadata: string | null): Record<string, string> {
  if (!metadata) return {};
  try {
    return JSON.parse(metadata) as Record<string, string>;
  } catch {
    return {};
  }
}

export function ActivityCard({ activity, index = 0, onCopyTask }: { activity: Activity; index?: number; onCopyTask?: (taskId: string) => void }) {
  const typeMeta = TYPE_META[activity.type] ?? TYPE_META.TASK_COMPLETED;
  const Icon = typeMeta.icon;
  const when = formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: ru });
  const tag = parseTag(activity.body);
  const col = tag ? tagColor(tag) : undefined;
  const parsed = parseMeta(activity.metadata);
  const challengePostId = parsed.challengePostId ?? parsed.postId;
  const eventId = parsed.eventId;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "card-surface p-4 overflow-hidden",
        activity.type.includes("CHALLENGE") && "border-l-[3px] border-l-heat",
        activity.type.includes("TASK") && "border-l-[3px] border-l-lime",
        activity.type.includes("ACHIEVEMENT") && "border-l-[3px] border-l-good",
        activity.type.includes("EVENT") && "border-l-[3px] border-l-ice",
      )}
    >
      <div className="flex gap-3">
        <Link href={`/profile/${activity.user.username}`} className="shrink-0">
          <Avatar className="h-11 w-11 ring-1 ring-white/[0.08]">
            <AvatarImage src={activity.user.avatar ?? undefined} />
            <AvatarFallback className="bg-lime/15 text-lime text-xs font-bold">
              {activity.user.name.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/profile/${activity.user.username}`} className="font-bold text-sm hover:text-lime transition-colors">
              {activity.user.name}
            </Link>
            <span className="text-[11px] text-muted-foreground">@{activity.user.username}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold", typeMeta.className)}>
              <Icon className="h-3 w-3" />
              {typeMeta.label}
            </span>
            <span className="text-[11px] text-muted-foreground">{when}</span>
          </div>
          <p className="text-sm leading-relaxed mt-2">
            {typeMeta.act} <b className="font-bold">«{activity.title}»</b>
          </p>
          <div className="flex flex-wrap gap-2 items-center mt-2 text-xs">
            {tag && col && (
              <span className="font-bold px-2 py-0.5 rounded-md" style={{ color: col, background: `${col}22` }}>#{tag}</span>
            )}
            {activity.xpGained != null && (
              <span className="font-bold text-[#FFB020]">⚡ +{activity.xpGained} XP</span>
            )}
          </div>
          {(activity.type === "TASK_COMPLETED" || activity.type === "TASK_PROOF") && activity.taskId && onCopyTask && (
            <button
              type="button"
              onClick={() => onCopyTask(activity.taskId!)}
              className="mt-3 w-full rounded-[13px] px-3 py-2.5 text-xs font-bold text-foreground bg-white/[0.04] border border-white/[0.08] hover:border-lime/30 transition-colors cursor-pointer"
            >
              + Забрать себе
            </button>
          )}
          {activity.type === "TASK_CREATED" && activity.taskId && onCopyTask && (
            <button
              type="button"
              onClick={() => onCopyTask(activity.taskId!)}
              className="mt-3 w-full rounded-[13px] px-3 py-2.5 text-xs font-bold text-foreground bg-white/[0.04] border border-white/[0.08] hover:border-lime/30 transition-colors cursor-pointer"
            >
              Повторить
            </button>
          )}
          {activity.type.includes("CHALLENGE") && (
            <Link
              href={challengePostId ? `/post/${challengePostId}` : "/challenges"}
              className="mt-3 inline-flex w-full items-center justify-center rounded-[13px] px-3 py-2.5 text-xs font-bold text-heat bg-heat/10 border border-heat/20 hover:bg-heat/15 transition-colors"
            >
              {activity.type === "CHALLENGE_CREATED" ? "Открыть" : "Вступить"}
            </Link>
          )}
          {(activity.type === "DUEL_MARKED" || activity.type === "DUEL_STARTED") && (
            <Link
              href="/friends?view=duels"
              className="mt-3 inline-flex w-full items-center justify-center rounded-[13px] px-3 py-2.5 text-xs font-bold text-foreground bg-white/[0.04] border border-white/[0.08] hover:border-heat/30 transition-colors"
            >
              Открыть спор
            </Link>
          )}
          {activity.type === "EVENT_ATTENDED" && (
            <Link
              href={eventId ? `/events/${eventId}` : "/nearby"}
              className="mt-3 inline-flex w-full items-center justify-center rounded-[13px] px-3 py-2.5 text-xs font-bold text-ice bg-ice/10 border border-ice/20 hover:bg-ice/15 transition-colors"
            >
              Пойти
            </Link>
          )}
          {activity.type === "MEDIA_ADDED" && (
            <CopyMediaButton activity={activity} />
          )}
          {activity.type === "WISHLIST_ADDED" && (
            <Link
              href={`/profile/${activity.user.username}?tab=wishlists`}
              className="mt-3 inline-flex w-full items-center justify-center rounded-[13px] px-3 py-2.5 text-xs font-bold text-good bg-good/10 border border-good/20 hover:bg-good/15 transition-colors"
            >
              Открыть вишлист
            </Link>
          )}
          {activity.type === "SHARED_GOAL_UPDATED" && (
            <Link
              href="/friends?view=together"
              className="mt-3 inline-flex w-full items-center justify-center rounded-[13px] px-3 py-2.5 text-xs font-bold text-lime bg-lime/10 border border-lime/20 hover:bg-lime/15 transition-colors"
            >
              Открыть список
            </Link>
          )}
          {activity.type === "ACHIEVEMENT_UNLOCKED" && (
            <Link
              href={`/profile/${activity.user.username}?tab=achievements`}
              className="mt-3 inline-flex w-full items-center justify-center rounded-[13px] px-3 py-2.5 text-xs font-bold text-good bg-good/10 border border-good/20 hover:bg-good/15 transition-colors"
            >
              Открыть ачивку
            </Link>
          )}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => void cheerActivityAction(activity.id)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-lime transition-colors cursor-pointer"
            >
              <Heart className="h-4 w-4" /> Поддержать
            </button>
            <FeedReactions likes={0} comments={0} className="border-0 pt-0 mt-0 flex-1 justify-end" />
          </div>
        </div>
      </div>
    </motion.article>
  );
}
