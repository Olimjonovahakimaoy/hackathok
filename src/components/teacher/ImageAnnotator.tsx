"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "../Icon";
import { uploadFile, type UploadedFile } from "@/lib/client-upload";

type Stroke = { color: string; width: number; pts: [number, number][] };

/** Ustoz o'quvchi rasmiga qizil/yashil ruchka bilan belgi qo'yadi va saqlaydi */
export function ImageAnnotator({ src, name, onSaved }: { src: string; name: string; onSaved: (f: UploadedFile) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const img = useRef<HTMLImageElement | null>(null);
  const strokes = useRef<Stroke[]>([]);
  const drawing = useRef<Stroke | null>(null);
  const [color, setColor] = useState("#e0312b");
  const [count, setCount] = useState(0);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const redraw = () => {
    const c = canvas.current;
    const im = img.current;
    if (!c || !im) return;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(im, 0, 0, c.width, c.height);
    for (const s of [...strokes.current, ...(drawing.current ? [drawing.current] : [])]) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      s.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
    }
  };

  useEffect(() => {
    const im = new Image();
    im.onload = () => {
      img.current = im;
      const c = canvas.current!;
      const scale = Math.min(1, 1800 / Math.max(im.naturalWidth, im.naturalHeight));
      c.width = Math.round(im.naturalWidth * scale);
      c.height = Math.round(im.naturalHeight * scale);
      setReady(true);
      redraw();
    };
    im.src = src;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const pos = (e: React.PointerEvent) => {
    const c = canvas.current!;
    const r = c.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * c.width, ((e.clientY - r.top) / r.height) * c.height] as [number, number];
  };

  const down = (e: React.PointerEvent) => {
    if (!ready) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const c = canvas.current!;
    drawing.current = { color, width: Math.max(3, c.width / 250), pts: [pos(e)] };
    setSaved(false);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    drawing.current.pts.push(pos(e));
    redraw();
  };
  const up = () => {
    if (!drawing.current) return;
    if (drawing.current.pts.length > 1) strokes.current.push(drawing.current);
    drawing.current = null;
    setCount(strokes.current.length);
    redraw();
  };

  const save = async () => {
    const c = canvas.current;
    if (!c) return;
    setSaving(true);
    try {
      const blob: Blob | null = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.88));
      if (!blob) throw new Error("Saqlab bo'lmadi");
      const f = await uploadFile(blob, `tekshirilgan-${name.replace(/\.\w+$/, "")}.jpg`);
      onSaved(f);
      setSaved(true);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl bg-cream ring-1 ring-ink/10">
      <div className="flex flex-wrap items-center gap-2 bg-white p-2">
        {[
          ["#e0312b", "Xato (qizil)"],
          ["#3f9a2b", "To'g'ri (yashil)"],
        ].map(([c, l]) => (
          <button key={c} type="button" onClick={() => setColor(c)} className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold ${color === c ? "bg-cream ring-2 ring-ink/20" : ""}`}>
            <span className="size-4 rounded-full" style={{ background: c }} /> {l}
          </button>
        ))}
        <button type="button" onClick={() => { strokes.current.pop(); setCount(strokes.current.length); redraw(); }} disabled={!count} className="btn-ghost btn-sm"><Icon name="undo" size={14} /> Ortga</button>
        <button type="button" onClick={() => { strokes.current = []; setCount(0); redraw(); }} disabled={!count} className="btn-ghost btn-sm">Tozalash</button>
        <button type="button" onClick={save} disabled={!count || saving || saved} className="btn-daisy btn-sm ml-auto">
          <Icon name="check" size={14} /> {saved ? "Biriktirildi" : saving ? "Saqlanmoqda…" : "Belgilarni saqlash"}
        </button>
      </div>
      <canvas
        ref={canvas}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        className="block h-auto w-full cursor-crosshair touch-none"
        aria-label="Rasmga belgi qo'yish maydoni"
      />
      {!ready && <div className="p-8 text-center text-sm text-ink-soft">Rasm yuklanmoqda…</div>}
    </div>
  );
}
