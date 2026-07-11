"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { AdminPreviewProvider, useAdminPreview } from "@/components/admin/preview/admin-preview-provider";
import { AdminPreviewPaneConnected, AdminPreviewPaneContent } from "@/components/admin/preview/admin-preview-pane";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { AdminPreviewMap } from "@/lib/admin/preview-types";
import { cn } from "@/lib/utils";

function AdminPreviewStickyPane() {
  return (
    <AdminPreviewPaneConnected className="sticky top-[76px] hidden max-h-[calc(100vh-96px)] xl:flex" />
  );
}

function AdminPreviewMobileSheet() {
  const { selectedId, selected, select } = useAdminPreview();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1279px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (!isMobile) return null;

  return (
    <Sheet open={!!selectedId} onOpenChange={(open) => !open && select(null)}>
      <SheetContent side="right" className="w-full sm:max-w-md border-white/10 bg-[#0a0a10] p-0">
        <SheetHeader className="border-b border-white/[0.06] px-5 py-4 text-left">
          <SheetTitle className="font-heading text-lg text-lime">Предпросмотр</SheetTitle>
        </SheetHeader>
        <AdminPreviewPaneContent data={selected} />
      </SheetContent>
    </Sheet>
  );
}

function AdminPreviewLayoutInner({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[11px] text-muted-foreground">
        <Eye className="h-3.5 w-3.5 text-lime shrink-0" />
        Клик по строке — предпросмотр справа · действия в таблице не сбрасывают выбор
      </div>
      <div className={cn("grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]")}>
        <div className="min-w-0">{children}</div>
        <AdminPreviewStickyPane />
      </div>
      <AdminPreviewMobileSheet />
    </>
  );
}

export function AdminPreviewRoot({
  previews,
  children,
  defaultSelectedId,
}: {
  previews: AdminPreviewMap;
  children: React.ReactNode;
  defaultSelectedId?: string | null;
}) {
  if (Object.keys(previews).length === 0) {
    return <>{children}</>;
  }

  return (
    <AdminPreviewProvider previews={previews} defaultSelectedId={defaultSelectedId}>
      <AdminPreviewLayoutInner>{children}</AdminPreviewLayoutInner>
    </AdminPreviewProvider>
  );
}
