import { Suspense } from "react";
import { MapPin } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { NearbyView } from "@/components/nearby/nearby-view";
import { getNearbyPayload } from "@/lib/api/nearby-service";
import { getSession } from "@/lib/auth";
import { DEFAULT_NEARBY_RADIUS_KM, parseCoord } from "@/lib/geo";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ radius?: string; radiusKm?: string; district?: string }>;

export default async function NearbyPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const session = await getSession();
  const radiusKm = parseCoord(params.radiusKm ?? params.radius) ?? DEFAULT_NEARBY_RADIUS_KM;

  const payload = await getNearbyPayload(session, {
    radiusKm,
    district: params.district,
  });

  return (
    <PageShell
      title="Рядом"
      description="Движ в радиусе пешей доступности"
      icon={<MapPin className="h-6 w-6" />}
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
