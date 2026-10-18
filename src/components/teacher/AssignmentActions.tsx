"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAssignment, extendAssignment } from "@/app/teacher/actions";
import { Icon } from "../Icon";

export function AssignmentActions({ id, canEdit }: { id: string; canEdit: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  if (!canEdit) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await extendAssignment(id, 1);
            setMsg(r.ok ? r.message ?? "" : r.error);
            router.refresh();
          })
        }
        className="btn-ghost btn-sm"
      >
        <Icon name="clock" size={14} /> +1 kun
      </button>
      <button
        disabled={pending}
        onClick={() => {
          if (!confirm("Vazifa va unga topshirilgan barcha ishlar (baholari bilan) o'chiriladi. Davom etasizmi?")) return;
          start(async () => {
            const r = await deleteAssignment(id);
            if (r.ok) router.push("/teacher/assignments");
            else setMsg(r.error);
          });
        }}
        className="btn-danger btn-sm"
      >
        <Icon name="trash" size={14} /> O&apos;chirish
      </button>
      {msg && <span className="text-xs font-semibold text-ink-soft">{msg}</span>}
    </div>
  );
}
