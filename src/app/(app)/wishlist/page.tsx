import { Gift } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { WishlistQuickView } from "@/components/v38/wishlist-quick-view";
import { getSession } from "@/lib/auth";
import { webGetDiaryBundle } from "@/lib/api/v1-web-services";

export const dynamic = "force-dynamic";

export default async function WishlistPage({
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
      title="Вишлист"
      description="Подарки и планы — surprise mode как в приложении"
      icon={<Gift className="h-6 w-6" />}
      accent="lime"
    >
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Загрузка…</div>}>
        <WishlistQuickView bundle={bundle} autoOpen={params.create === "1"} />
      </Suspense>
    </PageShell>
  );
}
