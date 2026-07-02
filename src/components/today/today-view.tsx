"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DiaryProvider, useDiary } from "@/components/profile/diary-context";
import { DiarySection } from "@/components/profile/diary-section";
import { DiaryCalendar } from "@/components/profile/diary-calendar";
import { AddTaskSheet } from "@/components/profile/add-task-sheet";
import { PersonalEventSheet } from "@/components/profile/personal-event-sheet";
import { AchievementPopup } from "@/components/profile/achievement-popup";
import { RefSurface } from "@/components/surface/ref-surface";
import { TodayRefHeader } from "@/components/today/today-ref-header";
import type { DiaryBundle } from "@/lib/diary-actions";

function TodayContent({ userName, username }: { userName?: string; username?: string }) {
  const searchParams = useSearchParams();
  const { openSheet, setDiaryView, loadCalendar, diaryView } = useDiary();
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
    <RefSurface className="max-w-lg mx-auto">
      <TodayRefHeader />

      <div className="mt-4">
        {diaryView === "calendar" ? (
          <>
            <button
              type="button"
              onClick={() => setDiaryView("list")}
              className="ref-card rounded-full px-4 py-2 text-xs font-extrabold ref-muted mb-3 cursor-pointer"
            >
              ← К списку
            </button>
            <DiaryCalendar />
          </>
        ) : (
          <DiarySection mode="today" userName={userName} username={username} />
        )}
      </div>

      <PersonalEventSheet open={eventOpen} onClose={() => setEventOpen(false)} onCreated={() => setEventOpen(false)} />
    </RefSurface>
  );
}

export function TodayView({
  bundle,
  userName,
  username,
}: {
  bundle: DiaryBundle;
  userName?: string;
  username?: string;
}) {
  return (
    <DiaryProvider initial={bundle}>
      <TodayContent userName={userName} username={username} />
      <AddTaskSheet />
      <AchievementPopup />
    </DiaryProvider>
  );
}
