"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { DiaryProvider, useDiary } from "@/components/profile/diary-context";
import { DiarySection } from "@/components/profile/diary-section";
import { DiaryPlannerHeader } from "@/components/profile/diary-planner-header";
import { AddTaskSheet } from "@/components/profile/add-task-sheet";
import { PersonalEventSheet } from "@/components/profile/personal-event-sheet";
import { AchievementPopup } from "@/components/profile/achievement-popup";
import { CreateMenuModal } from "@/components/layout/create-menu";
import type { DiaryBundle } from "@/lib/diary-actions";
import type { DiaryPeriod } from "@/components/profile/profile-data";

function TodayContent({ userName }: { userName?: string }) {
  const searchParams = useSearchParams();
  const { openSheet, setDiaryView, setPeriod, loadCalendar } = useDiary();
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
    <div className="p-4 lg:p-6 max-w-2xl mx-auto pb-28 relative space-y-4">
      <DiaryPlannerHeader
        onCreate={() => setCreateOpen(true)}
        onViewChanged={setDiaryView}
        onPeriodChanged={(p: DiaryPeriod) => setPeriod(p)}
      />
      <DiarySection mode="today" userName={userName} />
      <CreateMenuModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <PersonalEventSheet open={eventOpen} onClose={() => setEventOpen(false)} onCreated={() => setEventOpen(false)} />
      <button
        type="button"
        onClick={() => setCreateOpen(true)}
        className={cn(
          "lg:hidden fixed right-5 bottom-[72px] z-40 flex h-14 w-14 items-center justify-center",
          "rounded-[20px] bg-lime text-lime-foreground shadow-[0_12px_26px_rgba(200,255,87,0.35)]",
          "hover:-translate-y-0.5 active:scale-95 transition-transform cursor-pointer",
        )}
        aria-label="Создать"
      >
        <Plus className="h-7 w-7" />
      </button>
    </div>
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
