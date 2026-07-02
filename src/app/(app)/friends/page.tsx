import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getFriendsFeed, getDuelsForUser } from "@/lib/diary-actions";
import { getSharedGoalsForUser } from "@/lib/social-actions";
import { getSession } from "@/lib/auth";
import { FriendsFeed, FriendsPageShell } from "@/components/friends/friends-feed";
import { FriendsSubTabs } from "@/components/friends/friends-sub-tabs";
import { FriendsDuelsPanel } from "@/components/friends/friends-duels-panel";
import { FriendsTogetherPanel } from "@/components/friends/friends-together-panel";
import { FriendsPendingPanel } from "@/components/friends/friends-pending-panel";
import { listPendingFriendRequests } from "@/lib/api/friendship-service";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ view?: string; create?: string }>;

export default async function FriendsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login?next=/friends");

  const view = (params.view === "duels" || params.view === "together" ? params.view : "feed") as "feed" | "duels" | "together";

  const [data, duels, goals, pending] = await Promise.all([
    view === "feed" ? getFriendsFeed(session.id, session.city ?? "Москва", "ALL", "feed").catch(() => ({ activities: [], posts: [] })) : Promise.resolve({ activities: [], posts: [] }),
    view === "duels" ? getDuelsForUser(session.id) : Promise.resolve([]),
    view === "together" ? getSharedGoalsForUser(session.id) : Promise.resolve([]),
    listPendingFriendRequests(session.id),
  ]);

  return (
    <FriendsPageShell>
      <Suspense fallback={<div className="h-10 animate-pulse bg-muted rounded-full mb-4" />}>
        <FriendsSubTabs />
      </Suspense>
      {view === "feed" && <FriendsPendingPanel pending={pending} />}
      {view === "feed" && <FriendsFeed data={data} />}
      {view === "duels" && <FriendsDuelsPanel duels={duels} autoCreate={params.create === "1"} />}
      {view === "together" && <FriendsTogetherPanel goals={goals} autoCreate={params.create === "1"} />}
    </FriendsPageShell>
  );
}
