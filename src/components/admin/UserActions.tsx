"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteUser, resetClassPasswords, resetPassword, type Credential } from "@/app/admin/actions";
import { CredentialsSheet } from "./Credentials";
import { Icon } from "../Icon";

export function UserActions({ id, name, school }: { id: string; name: string; school: string }) {
  const router = useRouter();
  const [creds, setCreds] = useState<Credential[] | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex justify-end gap-1">
      {creds && <CredentialsSheet items={creds} onClose={() => setCreds(null)} school={school} />}
      <button
        disabled={pending}
        title="Yangi parol"
        onClick={() => confirm(`${name} uchun yangi parol yaratilsinmi? Eski parol ishlamay qoladi.`) && start(async () => { const r = await resetPassword(id); if (r.ok) setCreds(r.credentials ?? []); else alert(r.error); })}
        className="rounded-xl p-2 text-ink-soft hover:bg-sky-soft hover:text-sky-dark"
        aria-label="Parolni tiklash"
      >
        <Icon name="key" size={16} />
      </button>
      <button
        disabled={pending}
        title="O'chirish"
        onClick={() => confirm(`${name} o'chirilsinmi? Bu amalni qaytarib bo'lmaydi.`) && start(async () => { const r = await deleteUser(id); if (!r.ok) alert(r.error); router.refresh(); })}
        className="rounded-xl p-2 text-ink-soft hover:bg-danger/10 hover:text-danger"
        aria-label="O'chirish"
      >
        <Icon name="trash" size={16} />
      </button>
    </div>
  );
}

export function ClassCardsButton({ classId, school }: { classId: string; school: string }) {
  const [creds, setCreds] = useState<Credential[] | null>(null);
  const [pending, start] = useTransition();
  return (
    <>
      {creds && <CredentialsSheet items={creds} onClose={() => setCreds(null)} school={school} />}
      <button
        disabled={pending}
        onClick={() => {
          const parents = confirm("Ota-onalarga ham yangi parol yaratilsinmi?\n\nOK — ha, Bekor — faqat o'quvchilarga");
          if (!confirm("Diqqat: sinfdagi barcha eski parollar ishlamay qoladi. Davom etasizmi?")) return;
          start(async () => {
            const r = await resetClassPasswords(classId, parents);
            if (r.ok) setCreds(r.credentials ?? []);
            else alert(r.error);
          });
        }}
        className="btn-ghost"
      >
        <Icon name="printer" size={18} /> {pending ? "Tayyorlanmoqda…" : "Kirish kartochkalari"}
      </button>
    </>
  );
}
