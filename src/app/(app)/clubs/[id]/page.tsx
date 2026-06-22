import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Users, CalendarDays } from "lucide-react";
import { joinClubAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export default async function ClubDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  const club = await db.club.findUnique({
    where: { id },
    include: {
      creator: { select: { name: true, username: true } },
      members: {
        include: {
          user: { select: { name: true, username: true, avatar: true } },
        },
        take: 20,
      },
      events: {
        where: { startAt: { gte: new Date() } },
        orderBy: { startAt: "asc" },
        take: 5,
      },
      _count: { select: { members: true } },
    },
  });

  if (!club) notFound();

  const isMember = session
    ? club.members.some((m) => m.userId === session.id)
    : false;

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">{club.name}</h1>
        <p className="text-muted-foreground mt-2">{club.description}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge variant="secondary">
            <Users className="h-3 w-3 mr-1" />
            {club._count.members} участников
          </Badge>
          {club.district && <Badge variant="outline">{club.district}</Badge>}
          {club.isPrivate && <Badge variant="outline">Закрытый</Badge>}
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          Создатель:{" "}
          <Link
            href={`/profile/${club.creator.username}`}
            className="text-primary hover:underline cursor-pointer"
          >
            @{club.creator.username}
          </Link>
        </p>
        {session && !isMember && (
          <form action={joinClubAction.bind(null, club.id)} className="mt-4">
            <Button type="submit" className="cursor-pointer">
              Вступить в клуб
            </Button>
          </form>
        )}
      </div>

      {club.events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Ближайшие ивенты
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {club.events.map((event) => (
              <div key={event.id} className="p-3 rounded-xl bg-muted/50">
                <p className="font-medium">{event.title}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(event.startAt), "d MMMM, HH:mm", { locale: ru })}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Участники</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {club.members.map((m) => (
            <Link
              key={m.id}
              href={`/profile/${m.user.username}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
            >
              <span className="text-sm font-medium">{m.user.name}</span>
              <Badge variant="outline" className="text-xs ml-auto">
                {m.role}
              </Badge>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
