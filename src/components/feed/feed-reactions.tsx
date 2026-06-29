"use client";

import { Heart, MessageCircle, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function FeedReactions({ likes, comments, className }: { likes: number; comments: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 pt-3 mt-3 border-t border-white/[0.06] text-muted-foreground", className)}>
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold hover:text-lime cursor-pointer">
        <Heart className="h-4 w-4" /> {likes}
      </span>
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold hover:text-lime cursor-pointer">
        <MessageCircle className="h-4 w-4" /> {comments}
      </span>
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold hover:text-lime cursor-pointer ml-auto">
        <Share2 className="h-4 w-4" />
      </span>
    </div>
  );
}
