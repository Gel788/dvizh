import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Film } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { MediaQuickView } from "@/components/v38/media-quick-view";
import { getSession } from "@/lib/auth";
import { webGetDiaryBundle } from "@/lib/api/v1-web-services";

export const dynamic = "force-dynamic";

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ create?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const bundle = await webGetDiaryBundle(session.id);

  return (
    <PageShell
      title="Медиалист"
      description="Фильмы, сериалы, книги и игры — твой ритм"
      icon={<Film className="h-6 w-6" />}
      accent="ice"
    >
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Загрузка…</div>}>
        <MediaQuickView bundle={bundle} autoOpen={params.create === "1"} />
      </Suspense>
    </PageShell>
  );
}
