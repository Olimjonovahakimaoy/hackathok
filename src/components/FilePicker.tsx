"use client";

import { useRef, useState } from "react";
import { Icon } from "./Icon";
import { compressImage, fileUrl, uploadFile, type UploadedFile } from "@/lib/client-upload";

/**
 * Rasm (kamera yoki galereya) va PDF yuklash.
 * Yuklangan fayllar darhol serverga ketadi, formaga faqat ID lar beriladi.
 */
export function FilePicker({
  value,
  onChange,
  max = 8,
  extra,
  allowPdf = true,
  kids = false,
}: {
  value: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  max?: number;
  extra?: Record<string, string>;
  allowPdf?: boolean;
  kids?: boolean;
}) {
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handle(list: FileList | null) {
    if (!list?.length) return;
    setError(null);
    const room = max - value.length;
    const files = Array.from(list).slice(0, room);
    if (list.length > room) setError(`Ko'pi bilan ${max} ta fayl.`);
    setBusy((b) => b + files.length);
    const results: UploadedFile[] = [];
    for (const f of files) {
      try {
        const prepared = await compressImage(f);
        results.push(await uploadFile(prepared, f.name, extra));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Yuklab bo'lmadi");
      } finally {
        setBusy((b) => b - 1);
      }
    }
    onChange([...value, ...results]);
    if (camera.current) camera.current.value = "";
    if (gallery.current) gallery.current.value = "";
  }

  const accept = allowPdf ? "image/*,application/pdf" : "image/*";

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => camera.current?.click()} disabled={value.length >= max} className={kids ? "btn-green text-base" : "btn-green"}>
          <Icon name="camera" size={18} /> {kids ? "📸 Rasmga olish" : "Rasmga olish"}
        </button>
        <button type="button" onClick={() => gallery.current?.click()} disabled={value.length >= max} className="btn-ghost">
          <Icon name="image" size={18} /> {allowPdf ? "Rasm yoki PDF tanlash" : "Galereyadan tanlash"}
        </button>
        <input ref={camera} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handle(e.target.files)} />
        <input ref={gallery} type="file" accept={accept} multiple className="hidden" onChange={(e) => handle(e.target.files)} />
      </div>
      {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
      {(value.length > 0 || busy > 0) && (
        <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((f) => (
            <li key={f.id} className="group relative aspect-square overflow-hidden rounded-2xl bg-cream ring-1 ring-ink/10">
              {f.mime.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fileUrl(f.id)} alt={f.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center p-2 text-center text-xs font-semibold text-ink-soft">
                  <Icon name="file" size={28} />
                  <span className="line-clamp-2">{f.name}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x.id !== f.id))}
                className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full bg-ink/70 text-white opacity-90 hover:bg-danger"
                aria-label="Olib tashlash"
              >
                <Icon name="x" size={14} />
              </button>
            </li>
          ))}
          {Array.from({ length: busy }).map((_, i) => (
            <li key={`b${i}`} className="grid aspect-square animate-pulse place-items-center rounded-2xl bg-sky-soft text-xs font-semibold text-sky-dark">
              Yuklanmoqda…
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
