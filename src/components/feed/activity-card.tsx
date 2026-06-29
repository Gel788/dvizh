"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { BookOpen, Target, Trophy, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { FeedReactions } from "./feed-reactions";
import { tagColor } from "@/components/profile/profile-data";

type Activity = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  xpGained: number | null;
  taskId: string | null;
  createdAt: Date;
  user: { id: string; name: string; username: string; avatar: string | null; verified: boolean };
};

const TYPE_META: Record<string, { label: string; act: string; icon: typeof Zap; className: string }> = {
  TASK_COMPLETED: { label: "Дневник", act: "выполнил задачу", icon: BookOpen, className: "text-lime bg-lime/10" },
  TASK_CREATED: { label: "Задача", act: "создал задачу", icon: BookOpen, className: "text-ice bg-ice/10" },
  CHALLENGE_JOINED: { label: "Челлендж", act: "присоединился к челленджу", icon: Target, className: "text-heat bg-heat/10" },
  CHALLENGE_CREATED: { label: "Челлендж", act: "запустил челлендж", icon: Target, className: "text-heat bg-heat/10" },
  ACHIEVEMENT_UNLOCKED: { label: "Ачивка", act: "получил ачивку", icon: Trophy, className: "text-good bg-good/10" },
  EVENT_ATTENDED: { label: "Событие", act: "посетил событие", icon: Zap, className: "text-ice bg-ice/10" },
  DUEL_MARKED: { label: "Спор", act: "отметился в споре", icon: Target, className: "text-heat bg-heat/10" },
};

function parseTag(body: string | null) {
  if (!body?.startsWith("#")) return null;
  return body.slice(1).split(/\s/)[0];
}

export function ActivityCard({ activity, index = 0, onCopyTask }: { activity: Activity; index?: number; onCopyTask?: (taskId: string) => void }) {
  const meta = TYPE_META[activity.type] ?? TYPE_META.TASK_COMPLETED;
  const Icon = meta.icon;
  const when = formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: ru });
  const tag = parseTag(activity.body);
  const col = tag ? tagColor(tag) : undefined;

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
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold", meta.className)}>
              <Icon className="h-3 w-3" />
              {meta.label}
            </span>
            <span className="text-[11px] text-muted-foreground">{when}</span>
          </div>
          <p className="text-sm leading-relaxed mt-2">
            {meta.act} <b className="font-bold">«{activity.title}»</b>
          </p>
          <div className="flex flex-wrap gap-2 items-center mt-2 text-xs">
            {tag && col && (
              <span className="font-bold px-2 py-0.5 rounded-md" style={{ color: col, background: `${col}22` }}>#{tag}</span>
            )}
            {activity.xpGained != null && (
              <span className="font-bold text-[#FFB020]">⚡ +{activity.xpGained} XP</span>
            )}
          </div>
          {activity.type === "TASK_COMPLETED" && activity.taskId && onCopyTask && (
            <button
              type="button"
              onClick={() => onCopyTask(activity.taskId!)}
              className="mt-3 w-full rounded-[13px] px-3 py-2.5 text-xs font-bold text-foreground bg-white/[0.04] border border-white/[0.08] hover:border-lime/30 transition-colors cursor-pointer"
            >
              + Добавить себе
            </button>
          )}
          <FeedReactions likes={0} comments={0} />
        </div>
      </div>
    </motion.article>
  );
}
