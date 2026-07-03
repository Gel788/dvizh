import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Bell, Target, Heart, MessageCircle, UserPlus, Calendar, Award, Users } from "lucide-react";
import { markNotificationsReadAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { NotificationType } from "@prisma/client";

const iconMap: Record<NotificationType, typeof Bell> = {
  FOLLOW: UserPlus,
  LIKE: Heart,
  COMMENT: MessageCircle,
  CHALLENGE_NEARBY: Target,
  CHALLENGE_REMINDER: Target,
  FRIEND_COMPLETED: Target,
  CLUB_INVITE: UserPlus,
  EVENT_REMINDER: Calendar,
  BADGE_EARNED: Award,
  SHARED_GOAL_INVITE: Users,
};

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const notifications = await db.notification.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold flex items-center gap-3">
          <Bell className="h-8 w-8 text-primary" />
          Уведомления
        </h1>
        <form action={markNotificationsReadAction}>
          <Button type="submit" variant="outline" size="sm" className="cursor-pointer">
            Прочитать все
          </Button>
        </form>
      </div>

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Нет уведомлений</p>
        ) : (
          notifications.map((n) => {
            const Icon = iconMap[n.type] ?? Bell;
            const content = (
              <Card
                className={`transition-colors duration-200 ${!n.read ? "border-primary/30 bg-primary/5" : ""}`}
              >
                <CardContent className="flex items-start gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{n.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
                    <time className="text-xs text-muted-foreground mt-2 block">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ru })}
                    </time>
                  </div>
                  {!n.read && (
                    <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                  )}
                </CardContent>
              </Card>
            );

            return n.link ? (
              <Link key={n.id} href={n.link} className="block cursor-pointer">
                {content}
              </Link>
            ) : (
              <div key={n.id}>{content}</div>
            );
          })
        )}
      </div>
    </div>
  );
}
