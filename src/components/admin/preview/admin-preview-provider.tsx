"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { AdminPreviewMap, AdminPreviewPayload } from "@/lib/admin/preview-types";

type AdminPreviewContextValue = {
  previews: AdminPreviewMap;
  selectedId: string | null;
  selected: AdminPreviewPayload | null;
  select: (id: string | null) => void;
};

const AdminPreviewContext = createContext<AdminPreviewContextValue | null>(null);

export function AdminPreviewProvider({
  previews,
  children,
  defaultSelectedId,
}: {
  previews: AdminPreviewMap;
  children: React.ReactNode;
  defaultSelectedId?: string | null;
}) {
  const firstId = defaultSelectedId ?? Object.keys(previews)[0] ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(firstId);

  const selected = selectedId ? previews[selectedId] ?? null : null;

  const select = useCallback((id: string | null) => setSelectedId(id), []);

  const value = useMemo(
    () => ({ previews, selectedId, selected, select }),
    [previews, selectedId, selected, select],
  );

  return (
    <AdminPreviewContext.Provider value={value}>{children}</AdminPreviewContext.Provider>
  );
}

export function useAdminPreview() {
  const ctx = useContext(AdminPreviewContext);
  if (!ctx) throw new Error("useAdminPreview must be used within AdminPreviewProvider");
  return ctx;
}

export function useAdminPreviewOptional() {
  return useContext(AdminPreviewContext);
}
