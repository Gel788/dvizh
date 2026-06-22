"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addCommentAction } from "@/lib/actions";

export function CommentForm({ postId }: { postId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await addCommentAction(postId, String(formData.get("content") ?? ""));
        });
      }}
      className="flex gap-2"
    >
      <Textarea name="content" placeholder="Написать комментарий..." rows={2} className="flex-1" />
      <Button type="submit" disabled={pending} className="cursor-pointer self-end">
        {pending ? "..." : "Отправить"}
      </Button>
    </form>
  );
}
