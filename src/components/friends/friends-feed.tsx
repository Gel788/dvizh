"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Users, Swords } from "lucide-react";
import { PostCard } from "@/components/feed/post-card";
import { ActivityCard } from "@/components/feed/activity-card";
import { copyTaskToDiaryAction } from "@/lib/diary-actions";
import { PageShell } from "@/components/layout/page-shell";

type FeedData = {
  activities: Parameters<typeof ActivityCard>[0]["activity"][];
  posts: Parameters<typeof PostCard>[0]["post"][];
};

export function FriendsFeed({ data }: { data: FeedData }) {
  const [pending, startTransition] = useTransition();
  const { activities, posts } = data;

  const timeline = [
    ...activities.map((a) => ({ kind: "activity" as const, at: new Date(a.createdAt).getTime(), activity: a })),
    ...posts.map((p) => ({ kind: "post" as const, at: new Date(p.createdAt).getTime(), post: p })),
  ].sort((a, b) => b.at - a.at);

  function handleCopy(taskId: string) {
    startTransition(async () => {
      await copyTaskToDiaryAction(taskId);
      toast.success("Задача добавлена в твой дневник");
    });
  }

  return (
    <>
      <div className="space-y-3">
        {timeline.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <p className="text-muted-foreground text-sm">Подпишись на людей — их действия появятся здесь</p>
            <Link href="/nearby" className="btn-action mt-4 inline-flex text-xs">Найти рядом</Link>
          </div>
        ) : (
          timeline.map((item, i) =>
            item.kind === "activity" ? (
              <ActivityCard key={`a-${item.activity.id}`} activity={item.activity} index={i} onCopyTask={handleCopy} />
            ) : (
              <PostCard key={`p-${item.post.id}`} post={item.post} index={i} showAddToDiary />
            ),
          )
        )}
        {pending && <p className="text-center text-xs text-muted-foreground">Сохраняем…</p>}
      </div>
    </>
  );
}

export function FriendsPageShell({ children }: { children: React.ReactNode }) {
  return (
    <PageShell
      title="Друзья"
      description="Вся активность близкого круга — без курации"
      icon={<Users className="h-6 w-6" />}
      accent="ice"
      action={
        <Link href="/profile/demo?tab=duels" className="btn-action-outline btn-action text-xs py-2 px-3 gap-1.5 hidden sm:inline-flex">
          <Swords className="h-3.5 w-3.5" />
          Поединок
        </Link>
      }
    >
      {children}
    </PageShell>
  );
}
