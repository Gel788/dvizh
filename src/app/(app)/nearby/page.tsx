import { Suspense } from "react";
import { Compass } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { NearbyView } from "@/components/nearby/nearby-view";
import { webGetNearbyPayload } from "@/lib/api/v1-web-services";
import { getSession } from "@/lib/auth";
import { DEFAULT_NEARBY_RADIUS_KM, parseCoord } from "@/lib/geo";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ radius?: string; radiusKm?: string; district?: string; scope?: string }>;

export default async function NearbyPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const session = await getSession();
  const radiusKm = parseCoord(params.radiusKm ?? params.radius) ?? DEFAULT_NEARBY_RADIUS_KM;

  const payload = await webGetNearbyPayload(session, {
    radiusKm,
    district: params.district,
  });

  return (
    <PageShell
      title="События"
      description="Карта активностей — как в приложении"
      icon={<Compass className="h-6 w-6" />}
      accent="ice"
    >
      <Suspense fallback={<div className="h-[280px] animate-pulse bg-muted/40 rounded-[22px]" />}>
        <NearbyView
          city={payload.city}
          origin={payload.origin}
          hasGps={payload.hasGps}
          radiusKm={payload.radiusKm}
          district={payload.district}
          localItems={payload.local}
          globalItems={payload.global}
        />
      </Suspense>
    </PageShell>
  );
}
