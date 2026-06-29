import { format } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";
import { AdminTable, AdminTd, AdminTh } from "@/components/admin/admin-table";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteClubAction } from "@/lib/admin/actions";
import { db } from "@/lib/db";

export default async function AdminClubsPage() {
  const clubs = await db.club.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      creator: { select: { username: true, name: true } },
      _count: { select: { members: true, events: true } },
    },
  });

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-[1400px]">
      <div className="mb-8">
        <h1 className="font-heading text-4xl text-neon-lime leading-none">Клубы</h1>
        <p className="mt-2 text-sm text-white/45">{clubs.length} клубов</p>
      </div>

      <AdminTable>
        <thead>
          <tr>
            <AdminTh>Клуб</AdminTh>
            <AdminTh>Создатель</AdminTh>
            <AdminTh>Город</AdminTh>
            <AdminTh>Участники</AdminTh>
            <AdminTh>События</AdminTh>
            <AdminTh>Приватность</AdminTh>
            <AdminTh />
          </tr>
        </thead>
        <tbody>
          {clubs.map((c) => (
            <tr key={c.id}>
              <AdminTd>
                <Link href={`/clubs/${c.id}`} className="font-semibold hover:text-lime">
                  {c.name}
                </Link>
                <p className="text-xs text-white/35 line-clamp-1">{c.description}</p>
              </AdminTd>
              <AdminTd>@{c.creator.username}</AdminTd>
              <AdminTd>{c.city}</AdminTd>
              <AdminTd>{c._count.members}</AdminTd>
              <AdminTd>{c._count.events}</AdminTd>
              <AdminTd>{c.isPrivate ? "🔒 private" : "public"}</AdminTd>
              <AdminTd>
                <DeleteButton label={c.name} action={deleteClubAction.bind(null, c.id)} />
              </AdminTd>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    </div>
  );
}
