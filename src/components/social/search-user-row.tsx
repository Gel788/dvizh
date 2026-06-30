"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { UserSocialButtons } from "@/components/social/user-social-buttons";
import type { FriendshipState } from "@/lib/api/friendship-service";

type UserRow = {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  city: string;
  district: string | null;
  verified: boolean;
  _count: { followers: number };
  isFollowing?: boolean;
  friendshipState?: FriendshipState;
  friendshipId?: string | null;
};

export function SearchUserRow({ user, sessionId }: { user: UserRow; sessionId?: string }) {
  const isSelf = sessionId === user.id;

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-card/60 p-3">
      <Link href={`/profile/${user.username}`} className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-90">
        <Avatar className="h-11 w-11 shrink-0">
          <AvatarImage src={user.avatar ?? undefined} />
          <AvatarFallback className="bg-lime/15 text-lime text-xs font-bold">{user.name.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-bold text-sm flex items-center gap-1">
            {user.name}
            {user.verified && <VerifiedBadge />}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            @{user.username} · {user.city}{user.district ? ` · ${user.district}` : ""}
          </p>
        </div>
      </Link>
      {!isSelf && sessionId && (
        <UserSocialButtons
          userId={user.id}
          isFollowing={user.isFollowing ?? false}
          friendshipState={user.friendshipState ?? "none"}
          friendshipId={user.friendshipId ?? null}
          compact
        />
      )}
      {isSelf && <span className="text-xs text-muted-foreground shrink-0">это вы</span>}
    </li>
  );
}
