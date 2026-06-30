"use client";

import { useRef, useState, useTransition } from "react";
import { Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { uploadAvatarAction } from "@/lib/actions";

type Props = {
  name: string;
  avatar: string | null;
};

export function AvatarUpload({ name, avatar }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(avatar);
  const [pending, start] = useTransition();

  const onPick = () => inputRef.current?.click();

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 2 * 1024 * 1024) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      setPreview(dataUrl);
      const fd = new FormData();
      fd.set("avatar", dataUrl);
      start(async () => {
        await uploadAvatarAction(fd);
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={onPick}
        disabled={pending}
        className="relative group cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
        aria-label="Загрузить аватар"
      >
        <Avatar className="h-20 w-20 ring-2 ring-lime/20">
          <AvatarImage src={preview ?? undefined} />
          <AvatarFallback className="bg-lime/15 text-lime font-bold text-xl">{name.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="h-6 w-6 text-white" />
        </span>
      </button>
      <div className="text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Фото профиля</p>
        <p>JPG или PNG, до 2 МБ</p>
        {pending && <p className="text-lime mt-1">Загрузка…</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onChange}
      />
    </div>
  );
}
