"use client";

import type { PostType } from "@prisma/client";
import { FeedEventTile } from "./feed-event-tile";

type PostData = {
  id: string;
  type: PostType;
  title: string | null;
  content: string;
  author: {
    name: string;
    username: string;
    avatar: string | null;
  };
};

const TYPE_ACT: Record<PostType, string> = {
  ACTIVITY: "записал движ",
  CHALLENGE: "запустил челлендж",
  ANNOUNCEMENT: "опубликовал объявление",
};

export function FeedPostEventTile({ post }: { post: PostData }) {
  const act = TYPE_ACT[post.type];
  const title = post.title?.trim() || `${post.author.name.split(" ")[0]} ${act}`;
  const subtitle = post.content.replace(/\s+/g, " ").trim().slice(0, 96);

  return (
    <FeedEventTile
      href={`/post/${post.id}`}
      avatarUrl={post.author.avatar}
      avatarFallback={post.author.name}
      title={title}
      subtitle={subtitle || "Открыть карточку"}
      chips={["поддержать"]}
    />
  );
}
