"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { DiaryProvider, useDiary } from "@/components/profile/diary-context";
import { DiarySection } from "@/components/profile/diary-section";
import { DiaryCalendar } from "@/components/profile/diary-calendar";
import { AddTaskSheet } from "@/components/profile/add-task-sheet";
import { PersonalEventSheet } from "@/components/profile/personal-event-sheet";
import { AchievementPopup } from "@/components/profile/achievement-popup";
import { CreateMenuModal } from "@/components/layout/create-menu";
import { RefSurface } from "@/components/surface/ref-surface";
import { TodayRefHeader } from "@/components/today/today-ref-header";
import type { DiaryBundle } from "@/lib/diary-actions";
import type { DiaryPeriod } from "@/components/profile/profile-data";

function TodayContent({ userName }: { userName?: string }) {
  const searchParams = useSearchParams();
  const { openSheet, setDiaryView, setPeriod, loadCalendar, diaryView } = useDiary();
  const [createOpen, setCreateOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("openTask") === "1") openSheet();
    if (searchParams.get("view") === "calendar") {
      setDiaryView("calendar");
      void loadCalendar(new Date().getFullYear(), new Date().getMonth());
    }
    if (searchParams.get("openEvent") === "1") {
      setDiaryView("calendar");
      setEventOpen(true);
    }
  }, [searchParams, openSheet, setDiaryView, loadCalendar]);

  return (
    <RefSurface className="max-w-2xl mx-auto pb-32">
      <TodayRefHeader />

      <div className="mt-4 space-y-4">
        {diaryView === "calendar" ? (
          <>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDiaryView("list")}
                className="ref-card rounded-full px-4 py-2 text-xs font-extrabold ref-muted"
              >
                ← К списку
              </button>
            </div>
            <DiaryCalendar />
          </>
        ) : (
          <DiarySection mode="today" userName={userName} />
        )}
      </div>

      <CreateMenuModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <PersonalEventSheet open={eventOpen} onClose={() => setEventOpen(false)} onCreated={() => setEventOpen(false)} />

      <button
        type="button"
        onClick={() => setCreateOpen(true)}
        className={cn(
          "lg:hidden fixed right-5 bottom-[88px] z-40 flex h-14 w-14 items-center justify-center",
          "rounded-full text-[var(--ref-ink,#33251f)] shadow-[0_14px_34px_rgba(145,168,38,0.35)]",
          "hover:-translate-y-0.5 active:scale-95 transition-transform cursor-pointer",
        )}
        style={{ background: "linear-gradient(135deg, #f0cf2c, #98c84a)" }}
        aria-label="Создать"
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </button>
    </RefSurface>
  );
}

export function TodayView({ bundle, userName }: { bundle: DiaryBundle; userName?: string }) {
  return (
    <DiaryProvider initial={bundle}>
      <TodayContent userName={userName} />
      <AddTaskSheet />
      <AchievementPopup />
    </DiaryProvider>
  );
}
