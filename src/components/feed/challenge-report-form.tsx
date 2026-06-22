"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitChallengeReportAction } from "@/lib/actions";

export function ChallengeReportForm({
  challengeId,
  postId,
}: {
  challengeId: string;
  postId: string;
}) {
  return (
    <form action={submitChallengeReportAction} className="space-y-3 p-4 rounded-xl border border-border bg-card">
      <p className="text-sm font-medium">Отправить отчёт</p>
      <input type="hidden" name="challengeId" value={challengeId} />
      <input type="hidden" name="postId" value={postId} />
      <Textarea name="content" placeholder="Что сделал сегодня?" rows={2} required />
      <Button type="submit" size="sm" className="cursor-pointer">
        Отправить отчёт
      </Button>
    </form>
  );
}
