"use client";

export interface UploadedFile {
  id: string;
  name: string;
  mime: string;
  size: number;
}

/** Telefon rasmlarini yuborishdan oldin kichraytirish (trafik va joyni tejaydi) */
export async function compressImage(file: File, maxSide = 1800, quality = 0.85): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export async function uploadFile(file: File | Blob, name = "rasm.jpg", extra?: Record<string, string>): Promise<UploadedFile> {
  const fd = new FormData();
  fd.append("file", file, file instanceof File ? file.name : name);
  for (const [k, v] of Object.entries(extra ?? {})) fd.append(k, v);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Yuklashda xatolik");
  return data as UploadedFile;
}

export const fileUrl = (id: string) => `/api/files/${id}`;
