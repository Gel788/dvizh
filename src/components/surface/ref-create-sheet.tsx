"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { CREATE_ITEMS } from "@/components/layout/create-menu";

export function RefCreateSheet({
  open,
  onClose,
  username,
}: {
  open: boolean;
  onClose: () => void;
  username?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/25"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ y: 48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 48, opacity: 0 }}
            className="w-full max-w-lg rounded-t-[28px] bg-[var(--ref-paper)] border border-[var(--ref-line)] px-[18px] pt-[13px] pb-6"
          >
            <div className="mx-auto mb-[13px] h-[5px] w-[46px] rounded-full bg-[#e2d6c7]" />
            <h3 className="text-[22px] font-extrabold text-[var(--ref-ink)] mb-2.5">Что создать?</h3>
            <div className="grid grid-cols-2 gap-2">
              {CREATE_ITEMS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href(username ?? "")}
                  onClick={onClose}
                  className="ref-card p-3 active:scale-[0.98] transition-transform"
                >
                  <span className="text-[22px]">{item.emoji}</span>
                  <p className="text-[14.5px] font-bold text-[var(--ref-ink)] mt-1">{item.label}</p>
                  <p className="text-[12px] font-semibold ref-muted truncate">
                    {item.label === "Дело" && "задача, приоритет, дата, пруф"}
                    {item.label === "Событие" && "дата, время, повтор, напоминание"}
                    {item.label === "Спор" && "соревнование между друзьями"}
                    {item.label === "Вместе" && "общий список с участниками"}
                    {item.label === "Медиалист" && "фильм, книга, сериал, игра"}
                    {item.label === "Вишлист" && "желание, цена, ссылка"}
                  </p>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
