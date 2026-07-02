"use client";

import Link from "next/link";
import { useState } from "react";
import { Target, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { MotionEnter } from "@/components/ui/motion-surface";
import { joinChallengeAction, leaveChallengeAction } from "@/lib/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type ChallengeLeaderboardItem = {
  id: string;
  goalCount: number;
  viewerJoined?: boolean;
  myProgress?: number;
  post: {
    id: string;
    title: string | null;
    content: string;
    author: { name: string; avatar: string | null; username?: string };
  };
  participants: { progress: number }[];
  _count: { participants: number };
};

export function ChallengeLeaderboardRow({
  challenge,
  rank,
  index = 0,
  compact = false,
}: {
  challenge: ChallengeLeaderboardItem;
  rank: number;
  index?: number;
  compact?: boolean;
}) {
  const leader = challenge.participants[0];
  const progress = leader?.progress ?? 0;
  const goal = challenge.goalCount || 100;
  const [joined, setJoined] = useState(challenge.viewerJoined ?? false);
  const [participantCount, setParticipantCount] = useState(challenge._count.participants);
  const [busy, setBusy] = useState(false);
  const myProgress = challenge.myProgress ?? 0;

  async function toggleJoin(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const next = !joined;
    setJoined(next);
    setParticipantCount((c) => c + (next ? 1 : -1));
    try {
      if (next) {
        await joinChallengeAction(challenge.id);
        toast.success("Ты в вызове");
      } else {
        await leaveChallengeAction(challenge.id);
        toast.message("Вышел из вызова");
      }
    } catch {
      setJoined(!next);
      setParticipantCount((c) => c + (next ? -1 : 1));
      toast.error("Не удалось обновить участие");
    } finally {
      setBusy(false);
    }
  }

  return (
    <MotionEnter index={index}>
      <Link href={`/post/${challenge.post.id}`} className="card-surface block p-4 cursor-pointer group t-card-press">
        <div className="flex items-center gap-4">
          {!compact && (
            <span className="font-heading text-xl text-muted-foreground/40 w-8 text-center shrink-0">{rank}</span>
          )}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-heat/10 text-heat">
            <Target className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate group-hover:text-lime transition-colors">
              {challenge.post.title ?? challenge.post.content.slice(0, 80)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
              <Users className="h-3 w-3" />
              {challenge.post.author.name} · {participantCount} участников
            </p>
            {leader && (
              <div className="mt-2 flex items-center gap-2">
                <Progress value={Math.min(100, (progress / goal) * 100)} className="h-1.5 flex-1 progress-lime" />
                <span className="text-[10px] text-muted-foreground shrink-0">лидер {progress}/{goal}</span>
              </div>
            )}
            {joined && (
              <p className="text-[10px] text-lime font-bold mt-1.5">Твой прогресс: {myProgress}/{goal}</p>
            )}
          </div>
          <Button
            type="button"
            size="sm"
            variant={joined ? "outline" : "default"}
            disabled={busy}
            onClick={toggleJoin}
            className={cn(
              "shrink-0 text-xs font-bold cursor-pointer",
              !joined && "bg-lime text-lime-foreground hover:bg-lime/90",
            )}
          >
            {joined ? "Выйти" : "Вступить"}
          </Button>
        </div>
      </Link>
    </MotionEnter>
  );
}
