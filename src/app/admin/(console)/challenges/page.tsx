import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { AdminTable, AdminTd, AdminTh } from "@/components/admin/admin-table";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteChallengeAction } from "@/lib/admin/actions";
import { db } from "@/lib/db";

export default async function AdminChallengesPage() {
  const challenges = await db.challenge.findMany({
    orderBy: { post: { createdAt: "desc" } },
    include: {
      post: {
        select: {
          id: true,
          title: true,
          content: true,
          city: true,
          createdAt: true,
          author: { select: { username: true, name: true } },
        },
      },
      _count: { select: { participants: true, reports: true } },
    },
  });

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-[1400px]">
      <div className="mb-8">
        <h1 className="font-heading text-4xl text-neon-lime leading-none">Челленджи</h1>
        <p className="mt-2 text-sm text-white/45">{challenges.length} активных челленджей</p>
      </div>

      <AdminTable>
        <thead>
          <tr>
            <AdminTh>Название</AdminTh>
            <AdminTh>Автор</AdminTh>
            <AdminTh>Цель</AdminTh>
            <AdminTh>Участники</AdminTh>
            <AdminTh>Флаги</AdminTh>
            <AdminTh>Дедлайн</AdminTh>
            <AdminTh />
          </tr>
        </thead>
        <tbody>
          {challenges.map((c) => (
            <tr key={c.id}>
              <AdminTd>
                <p className="font-semibold">{c.post.title ?? c.post.content.slice(0, 60)}</p>
                <p className="text-xs text-white/35">{c.post.city}</p>
              </AdminTd>
              <AdminTd>@{c.post.author.username}</AdminTd>
              <AdminTd>{c.goalCount}</AdminTd>
              <AdminTd>{c._count.participants} · {c._count.reports} отчётов</AdminTd>
              <AdminTd className="text-xs">
                {c.isBusiness && <span className="text-heat">business </span>}
                {c.isSeasonal && <span className="text-ice">seasonal </span>}
                {c.isGlobal && <span className="text-lime">global</span>}
              </AdminTd>
              <AdminTd className="text-xs text-white/35">
                {c.deadline ? format(c.deadline, "d MMM yyyy", { locale: ru }) : "—"}
              </AdminTd>
              <AdminTd>
                <DeleteButton
                  label={c.post.title ?? "челлендж"}
                  action={deleteChallengeAction.bind(null, c.id)}
                />
              </AdminTd>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    </div>
  );
}
