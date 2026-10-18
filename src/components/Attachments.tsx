import type { Database } from "@/lib/types";
import { Icon } from "./Icon";

/** Fayllar ro'yxati: rasmlar kichik ko'rinishda, PDF lar havola sifatida */
export function Attachments({ db, ids, title }: { db: Database; ids: string[]; title?: string }) {
  const files = ids.map((id) => db.files.find((f) => f.id === id)).filter((f): f is NonNullable<typeof f> => !!f);
  if (!files.length) return null;
  const images = files.filter((f) => f.mime.startsWith("image/"));
  const docs = files.filter((f) => !f.mime.startsWith("image/"));
  return (
    <div>
      {title && <div className="label">{title}</div>}
      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((f) => (
            <li key={f.id}>
              <a href={`/api/files/${f.id}`} target="_blank" rel="noopener" className="block aspect-[4/3] overflow-hidden rounded-2xl bg-cream ring-1 ring-ink/10 transition hover:ring-sky">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/files/${f.id}`} alt={f.name} loading="lazy" className="h-full w-full object-cover" />
              </a>
            </li>
          ))}
        </ul>
      )}
      {docs.length > 0 && (
        <ul className="mt-2 space-y-2">
          {docs.map((f) => (
            <li key={f.id}>
              <a href={`/api/files/${f.id}`} target="_blank" rel="noopener" className="flex items-center gap-3 rounded-2xl bg-cream-light p-3 text-sm font-semibold ring-1 ring-ink/5 hover:ring-sky">
                <Icon name="file" size={20} className="text-daisy-dark" />
                <span className="min-w-0 flex-1 truncate">{f.name}</span>
                <span className="text-xs text-ink-soft">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
