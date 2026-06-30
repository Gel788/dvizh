"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { acceptFriendAction, rejectFriendAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";

type PendingItem = {
  id: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    verified: boolean;
    city: string;
  };
};

export function FriendsPendingPanel({ pending }: { pending: PendingItem[] }) {
  if (pending.length === 0) return null;

  return (
    <section className="mb-6 space-y-3">
      <h2 className="font-heading text-lg">Заявки в друзья · {pending.length}</h2>
      <ul className="space-y-2">
        {pending.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-card/60 p-3"
          >
            <Link href={`/profile/${item.user.username}`} className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar className="h-11 w-11">
                <AvatarImage src={item.user.avatar ?? undefined} />
                <AvatarFallback className="bg-lime/15 text-lime text-xs font-bold">
                  {item.user.name.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-bold text-sm flex items-center gap-1">
                  {item.user.name}
                  {item.user.verified && <VerifiedBadge />}
                </p>
                <p className="text-xs text-muted-foreground">@{item.user.username}</p>
              </div>
            </Link>
            <div className="flex gap-1 shrink-0">
              <form action={acceptFriendAction.bind(null, item.id)}>
                <Button type="submit" size="sm" className="cursor-pointer">Принять</Button>
              </form>
              <form action={rejectFriendAction.bind(null, item.id)}>
                <Button type="submit" size="sm" variant="ghost" className="cursor-pointer">Отклонить</Button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
