"use client";

import type { PostType } from "@prisma/client";
import { RefEventTile } from "@/components/surface/ref-ui";

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

const TYPE_EMOJI: Record<PostType, string> = {
  ACTIVITY: "🏃",
  CHALLENGE: "🏆",
  ANNOUNCEMENT: "📣",
};

export function FeedPostEventTile({ post }: { post: PostData }) {
  const act = TYPE_ACT[post.type];
  const firstName = post.author.name.split(" ")[0];
  const title = post.title?.trim() || `${firstName} ${act}`;
  const subtitle = post.content.replace(/\s+/g, " ").trim().slice(0, 120);

  return (
    <RefEventTile
      href={`/post/${post.id}`}
      leading={TYPE_EMOJI[post.type]}
      title={title}
      subtitle={subtitle || "Открыть карточку"}
      chips={["поддержать"]}
    />
  );
}
