"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchBar({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (term.length < 2) return;
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  return (
    <form onSubmit={submit} className="relative flex-1 max-w-md lg:max-w-lg xl:max-w-xl">
      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Поиск людей, челленджей, событий..."
        className="pl-9 h-9 bg-white/[0.04] border-white/[0.07] rounded-xl text-sm focus-visible:border-lime/40 focus-visible:bg-white/[0.06] placeholder:text-muted-foreground/40"
      />
    </form>
  );
}
