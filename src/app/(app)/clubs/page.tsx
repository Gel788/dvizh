import Link from "next/link";
import { Users, Lock, Plus, Zap } from "lucide-react";
import { joinClubAction, createClubAction } from "@/lib/actions";
import { PageShell } from "@/components/layout/page-shell";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const clubColors = [
  "from-lime/10 to-transparent",
  "from-heat/10 to-transparent",
  "from-ice/10 to-transparent",
  "from-purple-500/10 to-transparent",
  "from-orange-500/10 to-transparent",
];

export default async function ClubsPage() {
  const session = await getSession();
  const city = session?.city ?? "Москва";

  const clubs = await db.club.findMany({
    where: { city },
    include: {
      creator: { select: { name: true, username: true } },
      _count: { select: { members: true, events: true } },
      members: session
        ? { where: { userId: session.id }, select: { id: true } }
        : false,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PageShell
      title="КЛУБЫ"
      description="Комьюнити по интересам в твоём районе"
      icon={<Users className="h-6 w-6" />}
      accent="lime"
      action={
        session ? (
          <Dialog>
            <DialogTrigger className="btn-action py-2 px-4 text-xs gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Создать клуб
            </DialogTrigger>
            <DialogContent className="border-white/[0.09] bg-popover">
              <DialogHeader>
                <DialogTitle className="font-heading text-2xl">Новый клуб</DialogTitle>
              </DialogHeader>
              <form action={createClubAction} className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Название</Label>
                  <Input name="name" required className="rounded-xl border-white/[0.09] bg-white/[0.04] h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Описание</Label>
                  <Textarea name="description" required rows={3} className="rounded-xl border-white/[0.09] bg-white/[0.04]" />
                </div>
                <input type="hidden" name="city" value={city} />
                <div className="flex items-center gap-3">
                  <Switch id="isPrivate" name="isPrivate" />
                  <Label htmlFor="isPrivate" className="text-sm font-semibold cursor-pointer">Закрытый клуб</Label>
                </div>
                <button type="submit" className="btn-action w-full h-11">Создать</button>
              </form>
            </DialogContent>
          </Dialog>
        ) : undefined
      }
    >
      {clubs.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-heading text-3xl text-lime/40">КЛУБОВ НЕТ</p>
          <p className="text-muted-foreground text-sm mt-3">Стань первым — создай клуб</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {clubs.map((club, i) => {
            const members = Array.isArray(club.members) ? club.members : [];
            const isMember = members.length > 0;
            const colorClass = clubColors[i % clubColors.length];

            return (
              <div
                key={club.id}
                className="card-surface overflow-hidden group"
              >
                {/* accent strip */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${colorClass.replace("to-transparent", "to-white/0")}`} />

                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/clubs/${club.id}`}
                          className="font-bold text-base hover:text-lime transition-colors cursor-pointer leading-tight"
                        >
                          {club.name}
                        </Link>
                        {club.isPrivate && (
                          <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        от @{club.creator.username}
                      </p>
                    </div>
                    {isMember && (
                      <span className="chip chip-lime text-[10px] shrink-0">В клубе</span>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                    {club.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-3 text-[11px] text-muted-foreground font-semibold">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {club._count.members}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {club._count.events} ивентов
                      </span>
                      {club.district && <span>{club.district}</span>}
                    </div>

                    {session && !isMember && (
                      <form action={joinClubAction.bind(null, club.id)}>
                        <button
                          type="submit"
                          className="text-[11px] font-bold text-lime hover:text-lime/70 transition-colors cursor-pointer"
                        >
                          Вступить →
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
