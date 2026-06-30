"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { uploadAvatarAction } from "@/lib/actions";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  avatar: string | null;
  size?: "md" | "lg";
  showMascotSlot?: boolean;
  className?: string;
};

export function ProfileAvatarPicker({
  name,
  avatar,
  size = "lg",
  showMascotSlot = false,
  className,
}: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(avatar);
  const [pending, start] = useTransition();

  const dim = size === "lg" ? "h-16 w-16" : "h-20 w-20";
  const textSize = size === "lg" ? "text-lg" : "text-xl";

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
        router.refresh();
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={cn("relative shrink-0", className)}>
      <button
        type="button"
        onClick={onPick}
        disabled={pending}
        className="relative group cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
        aria-label="Сменить фото профиля"
      >
        <Avatar className={cn(dim, "ring-2 ring-lime/20")}>
          <AvatarImage src={preview ?? undefined} key={preview ?? "fallback"} />
          <AvatarFallback className={cn("bg-lime/15 text-lime font-bold", textSize)}>
            {name.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="h-5 w-5 text-white" />
        </span>
        {pending && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-[10px] text-white font-bold">
            …
          </span>
        )}
      </button>
      {showMascotSlot && <div className="absolute -right-3 -bottom-3 pointer-events-none" id="mascot-slot" />}
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
