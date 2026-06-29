"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

type Props = {
  activity: {
    id: string;
    title: string;
    body: string | null;
    createdAt: Date;
    user: { name: string; username: string; avatar: string | null };
  };
};

export function CuratedAchievementCard({ activity }: Props) {
  const when = formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: ru });

  return (
    <article className="card-surface p-5 border-lime/20">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lime/10 text-lime">
          <Trophy className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-lime mb-1">Ачивка в ленте</p>
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src={activity.user.avatar ?? undefined} />
              <AvatarFallback className="text-[10px]">{activity.user.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <Link href={`/profile/${activity.user.username}`} className="font-bold text-sm hover:text-lime">
              {activity.user.name}
            </Link>
            <span className="text-[11px] text-muted-foreground">{when}</span>
          </div>
          <p className="font-bold text-sm">{activity.title}</p>
          {activity.body && <p className="text-xs text-muted-foreground mt-1">{activity.body}</p>}
        </div>
      </div>
    </article>
  );
}
