import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable, AdminTd, AdminTh } from "@/components/admin/admin-table";
import { AdminInspectableRow } from "@/components/admin/preview/admin-inspectable-row";
import { AdminPreviewRoot } from "@/components/admin/preview/admin-preview-root";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteChallengeAction } from "@/lib/admin/actions";
import { serializeChallengePreview } from "@/lib/admin/preview-serialize";
import type { AdminPreviewMap } from "@/lib/admin/preview-types";
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
          author: { select: { username: true, name: true, avatar: true } },
        },
      },
      _count: { select: { participants: true, reports: true } },
    },
  });

  const previews: AdminPreviewMap = Object.fromEntries(
    challenges.map((c) => [c.id, serializeChallengePreview(c)]),
  );

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Контент"
        title="Челленджи"
        description={`${challenges.length} активных челленджей`}
      />

      <AdminPreviewRoot previews={previews}>
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
              <AdminInspectableRow key={c.id} inspectId={c.id}>
                <AdminTd>
                  <p className="font-semibold">{c.post.title ?? c.post.content.slice(0, 60)}</p>
                  <p className="text-xs text-white/35">{c.post.city}</p>
                </AdminTd>
                <AdminTd className="text-xs">@{c.post.author.username}</AdminTd>
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
                <AdminTd data-no-inspect>
                  <DeleteButton
                    label={c.post.title ?? "челлендж"}
                    action={deleteChallengeAction.bind(null, c.id)}
                  />
                </AdminTd>
              </AdminInspectableRow>
            ))}
          </tbody>
        </AdminTable>
      </AdminPreviewRoot>
    </AdminPage>
  );
}
