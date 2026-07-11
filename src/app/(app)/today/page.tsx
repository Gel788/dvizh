import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { webGetDiaryBundle } from "@/lib/api/v1-web-services";
import { TodayView } from "@/components/today/today-view";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const bundle = await webGetDiaryBundle(session.id);

  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Загрузка дневника…</div>}>
      <TodayView bundle={bundle} />
    </Suspense>
  );
}
