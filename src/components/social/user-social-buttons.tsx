"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  acceptFriendAction,
  friendRequestAction,
  rejectFriendAction,
  toggleFollowAction,
} from "@/lib/actions";
import type { FriendshipState } from "@/lib/api/friendship-service";

type Props = {
  userId: string;
  isFollowing: boolean;
  friendshipState: FriendshipState;
  friendshipId: string | null;
  compact?: boolean;
};

export function UserSocialButtons({
  userId,
  isFollowing,
  friendshipState,
  friendshipId,
  compact,
}: Props) {
  const [pending, start] = useTransition();

  const friendLabel = () => {
    if (friendshipState === "friends") return "В друзьях";
    if (friendshipState === "pending_sent") return "Заявка отправлена";
    if (friendshipState === "pending_received") return "Принять";
    return "В друзья";
  };

  const friendVariant = friendshipState === "friends" || friendshipState === "pending_sent"
    ? "outline"
    : "secondary";

  return (
    <div className={`flex shrink-0 gap-2 ${compact ? "flex-col" : "flex-row"}`}>
      <form action={toggleFollowAction.bind(null, userId)}>
        <Button
          type="submit"
          size="sm"
          variant={isFollowing ? "outline" : "default"}
          disabled={pending}
          className="cursor-pointer"
          onClick={() => start(() => {})}
        >
          {isFollowing ? "Отписаться" : "Подписаться"}
        </Button>
      </form>

      {friendshipState === "pending_received" && friendshipId ? (
        <div className="flex gap-1">
          <form action={acceptFriendAction.bind(null, friendshipId)}>
            <Button type="submit" size="sm" disabled={pending} className="cursor-pointer">
              Принять
            </Button>
          </form>
          <form action={rejectFriendAction.bind(null, friendshipId)}>
            <Button type="submit" size="sm" variant="ghost" disabled={pending} className="cursor-pointer">
              Отклонить
            </Button>
          </form>
        </div>
      ) : friendshipState !== "friends" && friendshipState !== "pending_sent" ? (
        <form action={friendRequestAction.bind(null, userId)}>
          <Button
            type="submit"
            size="sm"
            variant={friendVariant}
            disabled={pending}
            className="cursor-pointer"
          >
            {friendLabel()}
          </Button>
        </form>
      ) : (
        <Button type="button" size="sm" variant={friendVariant} disabled className="cursor-default">
          {friendLabel()}
        </Button>
      )}
    </div>
  );
}
