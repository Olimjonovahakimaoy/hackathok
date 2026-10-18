"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const subscribe = () => () => {};

/** Faqat brauzerda chiziladi (tasodifiy sonlar ishlatadigan o'yinlar uchun — hydration mos kelmasligining oldini oladi) */
export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  return mounted ? children : fallback;
}
