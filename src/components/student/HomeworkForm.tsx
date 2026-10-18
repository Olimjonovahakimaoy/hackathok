"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FilePicker } from "../FilePicker";
import { Icon } from "../Icon";
import { submitHomework } from "@/app/student/actions";
import type { UploadedFile } from "@/lib/client-upload";

export function HomeworkForm({
  assignmentId,
  initialText = "",
  initialFiles = [],
  kids,
  resubmit,
}: {
  assignmentId: string;
  initialText?: string;
  initialFiles?: UploadedFile[];
  kids?: boolean;
  resubmit?: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"photo" | "text">(initialText && !initialFiles.length ? "text" : "photo");
  const [text, setText] = useState(initialText);
  const [files, setFiles] = useState<UploadedFile[]>(initialFiles);
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = () => {
    setResult(null);
    start(async () => {
      const r = await submitHomework(assignmentId, text, files.map((f) => f.id));
      if (r.ok) {
        setResult({ ok: true, text: r.message ?? "Topshirildi" });
        router.refresh();
      } else setResult({ ok: false, text: r.error });
    });
  };

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-2xl bg-cream p-1" role="tablist">
        {(
          [
            ["photo", kids ? "📸 Daftardan rasm" : "Rasm / PDF"],
            ["text", kids ? "⌨️ Yozib yuborish" : "Elektron javob"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={mode === k}
            onClick={() => setMode(k)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${mode === k ? "bg-white text-night shadow" : "text-ink-soft"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "photo" ? (
        <div>
          <p className="mb-3 text-sm text-ink-soft">
            {kids ? "Daftaringizni yorug' joyda tekis qo'yib, rasmga oling." : "Daftar sahifalarini yorug' joyda, tekis holda suratga oling. Bir nechta rasm qo'shish mumkin."}
          </p>
          <FilePicker value={files} onChange={setFiles} kids={kids} />
          <label className="mt-4 block">
            <span className="label">Izoh (ixtiyoriy)</span>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={5000} className="input" placeholder="Ustozga qisqa izoh…" />
          </label>
        </div>
      ) : (
        <label className="block">
          <span className="label">Javobingiz</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={kids ? 6 : 10}
            maxLength={5000}
            className="input font-medium leading-relaxed"
            placeholder={kids ? "Javobingni shu yerga yoz…" : "Yechim, javoblar va tushuntirishlarni shu yerga yozing…"}
          />
          <span className="mt-1 block text-right text-xs text-ink-soft">{text.length}/5000</span>
        </label>
      )}

      {result && (
        <p role="status" className={`rounded-2xl px-4 py-3 text-sm font-semibold ${result.ok ? "bg-green-soft text-green-dark" : "bg-danger/10 text-danger"}`}>
          {result.text}
        </p>
      )}

      <button type="button" onClick={submit} disabled={pending || (!text.trim() && files.length === 0)} className={kids ? "btn-primary w-full py-3.5 text-base" : "btn-primary"}>
        <Icon name="send" size={18} /> {pending ? "Yuborilmoqda…" : resubmit ? "Qayta topshirish" : "Topshirish"}
      </button>
    </div>
  );
}
