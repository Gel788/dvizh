import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { getDiaryBundle } from "@/lib/diary-actions";
import { TodayView } from "@/components/today/today-view";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const bundle = await getDiaryBundle(session.id);

  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Загрузка дневника…</div>}>
      <TodayView bundle={bundle} />
    </Suspense>
  );
}
