import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { PulseDetailView } from "@/components/feed/pulse-detail-view";
import { getPulseDay } from "@/lib/pulse-service";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ tab?: string }>;

export default async function PulsePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login?next=/pulse");

  const city = session.city ?? "Москва";
  const pulse = await getPulseDay(city, session.id);

  return (
    <PageShell
      title="Пульс дня"
      description={`${city} · друзья, район, город и вызовы`}
      accent="ice"
    >
      <Suspense fallback={<div className="h-40 animate-pulse bg-muted/40 rounded-2xl" />}>
        <PulseDetailView pulse={pulse} initialTab={params.tab} />
      </Suspense>
    </PageShell>
  );
}
