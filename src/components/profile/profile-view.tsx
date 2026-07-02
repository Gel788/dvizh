"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Settings } from "lucide-react";
import { ProfileAvatarPicker } from "./profile-avatar-picker";
import { PostCard } from "@/components/feed/post-card";
import { Mascot } from "./mascot";
import { ProfileTabs } from "./profile-tabs";
import { AchievementsSection } from "./achievements-section";
import { DuelsSection } from "./duels-section";
import { WishlistsSection } from "./wishlists-section";
import { FriendWishlistsSection } from "./friend-wishlists-section";
import { GuestMediaSection, GuestAchievementsSection, GuestChallengesSection } from "./guest-profile-sections";
import { MediaSection } from "./media-section";
import { PrivacySection } from "./privacy-section";
import { DiaryProvider, useDiary } from "./diary-context";
import { AddTaskSheet } from "./add-task-sheet";
import { AchievementPopup } from "./achievement-popup";
import { levelInfo, rankName } from "./profile-data";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { UserSocialButtons } from "@/components/social/user-social-buttons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  friendWishlists?: Awaited<ReturnType<typeof import("@/lib/wishlist-service").listWishlistsForViewer>>;
  guestBundle?: Awaited<ReturnType<typeof import("@/lib/guest-profile-service").getGuestProfileBundle>>;
  viewerUsername?: string;
  viewerId?: string;
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
  const router = useRouter();
  const tab = (searchParams.get("tab") as ProfileTab) || "achievements";
  const { xp, level } = useDiary();

  useEffect(() => {
    const legacyTab = searchParams.get("tab");
    if (
      legacyTab === "diary"
      || searchParams.get("openTask")
      || searchParams.get("openEvent")
      || searchParams.get("view") === "calendar"
    ) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("tab");
      const q = params.toString();
      router.replace(q ? `/today?${q}` : "/today");
    }
  }, [searchParams, router]);

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto pb-28 relative space-y-5">
      <ProfileHeader user={user} isOwn xp={xp} level={level} />
      <ProfileTabs username={user.username} activeTab={tab} />
      {tab === "achievements" && <AchievementsSection />}
      {tab === "duels" && <DuelsSection />}
      {tab === "wishlists" && <WishlistsSection autoOpen={searchParams.get("create") === "1"} />}
      {tab === "media" && <MediaSection autoOpen={searchParams.get("create") === "1"} />}
      {tab === "privacy" && <PrivacySection />}
    </div>
  );
}

function GuestProfile({
  user, isFollowing, friendshipState, friendshipId, sessionId, posts,
  friendWishlists, guestBundle, viewerUsername, viewerId,
}: ProfileProps) {
  const wishlists = guestBundle?.wishlists ?? friendWishlists ?? [];
  const isSelf = sessionId === user.id;

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
      {guestBundle && (
        <>
          <GuestMediaSection media={guestBundle.media} isSelf={isSelf} />
          <GuestChallengesSection challenges={guestBundle.challenges} />
          <GuestAchievementsSection achievements={guestBundle.achievements as { slug: string; name: string; icon: string; color: string }[]} />
        </>
      )}
      {wishlists.length > 0 && (
        <FriendWishlistsSection wishlists={wishlists} viewerUsername={viewerUsername} />
      )}
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
  const stats = isOwn
    ? [
        { v: daysInApp, l: "дней в ДВЖ" },
        { v: user._count.following, l: "друга" },
        { v: user._count.followers, l: "подписчика" },
        { v: user.badges.length || 0, l: "из 500 ачивок" },
      ]
    : [
        { v: daysInApp, l: "дней в ДВЖ" },
        { v: user._count.following, l: "друга" },
        { v: user._count.followers, l: "подписчика" },
        { v: user._count.posts, l: "публикаций" },
      ];

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
          {isOwn ? (
            <>
              <ProfileAvatarPicker name={user.name} avatar={user.avatar} size="lg" />
              <Mascot className="absolute -right-3 -bottom-3 w-11 h-11 pointer-events-none" />
            </>
          ) : (
            <>
              <Avatar className="h-16 w-16 ring-2 ring-lime/20">
                <AvatarImage src={user.avatar ?? undefined} key={user.avatar ?? "fb"} />
                <AvatarFallback className="bg-lime/15 text-lime font-bold text-lg">{user.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
            </>
          )}
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
        {stats.map((s) => {
          const href = !isOwn
            ? undefined
            : s.l.includes("друга")
              ? "/friends"
              : s.l.includes("подписч")
                ? `/profile/${user.username}?tab=achievements`
                : s.l.includes("ачивок")
                  ? `/profile/${user.username}?tab=achievements`
                  : undefined;
          const inner = (
            <>
              <b className="font-heading text-lg text-lime block leading-none">{s.v}</b>
              <small className="text-[10px] text-muted-foreground leading-tight block mt-1">{s.l}</small>
            </>
          );
          return href ? (
            <Link key={s.l} href={href} className="card-surface p-3 text-center hover:border-lime/30 transition-colors block">
              {inner}
            </Link>
          ) : (
            <div key={s.l} className="card-surface p-3 text-center">{inner}</div>
          );
        })}
      </div>
    </div>
  );
}
