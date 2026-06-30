"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Settings, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostCard } from "@/components/feed/post-card";
import { Mascot } from "./mascot";
import { ProfileTabs } from "./profile-tabs";
import { DiarySection } from "./diary-section";
import { AchievementsSection } from "./achievements-section";
import { DuelsSection } from "./duels-section";
import { WishlistsSection } from "./wishlists-section";
import { MediaSection } from "./media-section";
import { PrivacySection } from "./privacy-section";
import { DiaryProvider, useDiary } from "./diary-context";
import { AddTaskSheet } from "./add-task-sheet";
import { AchievementPopup } from "./achievement-popup";
import { levelInfo, rankName } from "./profile-data";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { UserSocialButtons } from "@/components/social/user-social-buttons";
import type { FriendshipState } from "@/lib/api/friendship-service";
import type { DiaryBundle } from "@/lib/diary-actions";

export type ProfileTab = "diary" | "achievements" | "duels" | "wishlists" | "media" | "privacy";

type ProfileUser = {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  city: string;
  district: string | null;
  verified: boolean;
  reputation: number;
  createdAt?: Date;
  badges: { badge: { id: string; name: string } }[];
  _count: { posts: number; followers: number; following: number };
};

type PostItem = Parameters<typeof PostCard>[0]["post"];

type ProfileProps = {
  user: ProfileUser;
  isOwn: boolean;
  isFollowing: boolean;
  friendshipState?: FriendshipState;
  friendshipId?: string | null;
  sessionId?: string;
  posts: PostItem[];
  diaryBundle?: DiaryBundle;
};

export function ProfileView(props: ProfileProps) {
  if (props.isOwn && props.diaryBundle) {
    return (
      <DiaryProvider initial={props.diaryBundle}>
        <OwnProfile {...props} />
        <AddTaskSheet />
        <AchievementPopup />
      </DiaryProvider>
    );
  }
  return <GuestProfile {...props} />;
}

function OwnProfile({ user }: ProfileProps) {
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as ProfileTab) || "diary";
  const { xp, level, openSheet } = useDiary();

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto pb-28 relative space-y-5">
      <ProfileHeader user={user} isOwn xp={xp} level={level} />
      <ProfileTabs username={user.username} activeTab={tab} />
      {tab === "diary" && <DiarySection />}
      {tab === "achievements" && <AchievementsSection />}
      {tab === "duels" && <DuelsSection />}
      {tab === "wishlists" && <WishlistsSection />}
      {tab === "media" && <MediaSection />}
      {tab === "privacy" && <PrivacySection />}
      {tab === "diary" && (
        <button
          type="button"
          onClick={openSheet}
          className={cn(
            "fixed right-5 bottom-28 lg:bottom-8 z-40 flex h-14 w-14 items-center justify-center",
            "rounded-[20px] bg-lime text-lime-foreground shadow-[0_12px_26px_rgba(200,255,87,0.35)]",
            "hover:-translate-y-0.5 active:scale-95 transition-transform cursor-pointer",
          )}
          aria-label="Новая задача"
        >
          <Plus className="h-7 w-7" />
        </button>
      )}
    </div>
  );
}

function GuestProfile({ user, isFollowing, friendshipState, friendshipId, sessionId, posts }: ProfileProps) {
  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto pb-28 relative space-y-5">
      <ProfileHeader
        user={user}
        isOwn={false}
        isFollowing={isFollowing}
        friendshipState={friendshipState}
        friendshipId={friendshipId}
        sessionId={sessionId}
      />
      <div className="space-y-3">
        <h2 className="font-heading font-bold text-lg">Публичные действия</h2>
        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">Пока нет публичных записей</p>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}

function ProfileHeader({
  user, isOwn, xp = 0, level, isFollowing, friendshipState, friendshipId, sessionId,
}: {
  user: ProfileUser; isOwn: boolean; xp?: number; level?: number;
  isFollowing?: boolean; friendshipState?: FriendshipState; friendshipId?: string | null; sessionId?: string;
}) {
  const li = levelInfo(xp);
  const displayLevel = level ?? li.level;
  const daysInApp = user.createdAt
    ? Math.max(1, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000))
    : 1;
  const achievementCount = user.badges.length || 34;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <h1 className="font-heading text-2xl text-neon-lime leading-none">Профиль</h1>
        {isOwn && (
          <Link href="/settings" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-card text-muted-foreground hover:text-foreground transition-colors">
            <Settings className="h-5 w-5" />
          </Link>
        )}
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative shrink-0">
          <Avatar className="h-16 w-16 ring-2 ring-lime/20">
            <AvatarImage src={user.avatar ?? undefined} />
            <AvatarFallback className="bg-lime/15 text-lime font-bold text-lg">{user.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          {isOwn && <Mascot className="absolute -right-3 -bottom-3 w-11 h-11" />}
        </div>
        <div className="min-w-0">
          <p className="font-heading text-lg font-bold leading-tight flex items-center gap-1.5">
            {user.name}
            {user.verified && <VerifiedBadge className="h-5 w-5" />}
          </p>
          <p className="text-sm text-muted-foreground">
            @{user.username} · уровень {displayLevel} · {rankName(displayLevel)}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            📍 {[user.district, user.city].filter(Boolean).join(", ")}
          </p>
        </div>
        {!isOwn && sessionId && (
          <UserSocialButtons
            userId={user.id}
            isFollowing={isFollowing ?? false}
            friendshipState={friendshipState ?? "none"}
            friendshipId={friendshipId ?? null}
          />
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
          { v: daysInApp, l: "дней в ДВИЖ" },
          { v: user._count.following, l: "друга" },
          { v: user._count.followers, l: "подписчика" },
          { v: achievementCount, l: "из 500 ачивок" },
        ].map((s) => (
          <div key={s.l} className="card-surface p-3 text-center">
            <b className="font-heading text-lg text-lime block leading-none">{s.v}</b>
            <small className="text-[10px] text-muted-foreground leading-tight block mt-1">{s.l}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
