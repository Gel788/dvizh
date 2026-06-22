import { CityMap } from "@/components/map/city-map";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { CITY_COORDS } from "@/lib/geo";

export default async function MapPage() {
  const session = await getSession();
  const city = session?.city ?? "Москва";
  const coords = CITY_COORDS[city] ?? CITY_COORDS["Москва"];

  const posts = await db.post.findMany({
    where: {
      city,
      lat: { not: null },
      lng: { not: null },
    },
    select: {
      id: true,
      title: true,
      content: true,
      type: true,
      lat: true,
      lng: true,
      district: true,
    },
    take: 100,
  });

  const markers = posts
    .filter((p): p is typeof p & { lat: number; lng: number } => p.lat != null && p.lng != null)
    .map((p) => ({
      id: p.id,
      title: p.title,
      content: p.content,
      type: p.type,
      lat: p.lat,
      lng: p.lng,
      district: p.district,
    }));

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Карта города</h1>
          <p className="text-muted-foreground mt-1">
            Активности, челленджи и объявления на карте {city}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            Активности
          </Badge>
          <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
            Челленджи
          </Badge>
          <Badge variant="outline" className="bg-chart-5/10 text-chart-5 border-chart-5/20">
            Объявления
          </Badge>
        </div>
      </div>
      <CityMap markers={markers} center={[coords.lat, coords.lng]} />
    </div>
  );
}
