"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, MapPin } from "lucide-react";
import { createSponsoredPostAction } from "@/lib/admin/actions";
import { CITIES, MOSCOW_DISTRICTS } from "@/lib/geo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function SponsoredPostForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState("");
  const [pending, start] = useTransition();

  const onPick = () => inputRef.current?.click();

  const onImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 4 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      setPreview(dataUrl);
      setImageData(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (formData: FormData) => {
    if (imageData) formData.set("imageData", imageData);
    start(async () => {
      await createSponsoredPostAction(formData);
      setPreview(null);
      setImageData("");
      router.refresh();
    });
  };

  return (
    <form action={onSubmit} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 lg:grid-cols-2">
      <div className="space-y-2 lg:col-span-2">
        <label className="text-xs text-white/50">Заголовок</label>
        <Input name="title" placeholder="Кофейня «Бодрый понедельник»" className="h-9" />
      </div>
      <div className="space-y-2 lg:col-span-2">
        <label className="text-xs text-white/50">Текст</label>
        <Textarea name="content" required rows={3} placeholder="Описание акции для ленты и карты" />
      </div>
      <div className="space-y-2 lg:col-span-2">
        <label className="text-xs text-white/50 flex items-center gap-1">
          <MapPin className="h-3 w-3" /> Адрес (геокодится автоматически)
        </label>
        <Input name="address" placeholder="ул. Арбат, 12" className="h-9" />
      </div>
      <div className="space-y-2">
        <label className="text-xs text-white/50">Город</label>
        <select name="city" defaultValue="Москва" className="h-9 w-full rounded-md border border-white/10 bg-transparent px-3 text-sm">
          {CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-xs text-white/50">Район</label>
        <select name="district" className="h-9 w-full rounded-md border border-white/10 bg-transparent px-3 text-sm">
          <option value="">Не указан</option>
          {MOSCOW_DISTRICTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-xs text-white/50">Широта (опц.)</label>
        <Input name="lat" type="number" step="any" placeholder="55.75" className="h-9" />
      </div>
      <div className="space-y-2">
        <label className="text-xs text-white/50">Долгота (опц.)</label>
        <Input name="lng" type="number" step="any" placeholder="37.62" className="h-9" />
      </div>
      <div className="space-y-2">
        <label className="text-xs text-white/50">Boost (0–100)</label>
        <Input name="boost" type="number" defaultValue={90} min={0} max={100} className="h-9" />
      </div>
      <div className="space-y-2">
        <label className="text-xs text-white/50">Автор (username)</label>
        <Input name="authorUsername" placeholder="sponsor_brand" className="h-9" />
      </div>
      <div className="space-y-2 lg:col-span-2">
        <label className="text-xs text-white/50">Фото</label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onPick}
            className="flex h-24 w-24 items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[0.03] hover:border-lime/40 cursor-pointer overflow-hidden"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus className="h-8 w-8 text-white/30" />
            )}
          </button>
          <p className="text-xs text-white/40">JPG/PNG до 4 МБ · появится в ленте и на карте</p>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onImage} />
        </div>
      </div>
      <div className="lg:col-span-2">
        <Button type="submit" disabled={pending} className="cursor-pointer">
          {pending ? "Публикуем…" : "Опубликовать спонсора"}
        </Button>
      </div>
    </form>
  );
}
