"use client";

import { RefSectionHeader, RefEventTile, RefChip } from "@/components/surface/ref-ui";

type Tip = {
  title: string;
  subtitle?: string;
  href?: string;
};

export function FeedTipsSection({ tip }: { tip?: Tip }) {
  const title = tip?.title ?? "Вечером район оживает";
  const subtitle = tip?.subtitle ?? "с 18:00 до 21:00 обычно больше прогулок, футбола и событий";

  return (
    <>
      <RefSectionHeader title="Подсказки дня" />
      <RefEventTile
        href={tip?.href ?? "/pulse"}
        leading="🌆"
        title={title}
        subtitle={subtitle}
        trailing={<RefChip label="смотреть" tone="green" />}
      />
    </>
  );
}
