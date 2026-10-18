import { Fragment, type ReactNode } from "react";

/** Juda kichik, xavfsiz markdown (HTML kiritmasdan): **qalin**, *kursiv*, `kod`, ro'yxatlar, sarlavhalar */
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) out.push(<strong key={`${key}-${i++}`}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith("`")) out.push(<code key={`${key}-${i++}`} className="rounded bg-ink/5 px-1 py-0.5 font-mono text-[0.9em]">{t.slice(1, -1)}</code>);
    else out.push(<em key={`${key}-${i++}`}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let code: string[] | null = null;
  const flush = (k: number) => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    blocks.push(
      <Tag key={`l${k}`} className={list.ordered ? "ml-5 list-decimal space-y-1" : "ml-5 list-disc space-y-1"}>
        {list.items.map((it, i) => <li key={i}>{inline(it, `li${k}-${i}`)}</li>)}
      </Tag>,
    );
    list = null;
  };
  lines.forEach((line, k) => {
    if (line.trim().startsWith("```")) {
      if (code) {
        blocks.push(<pre key={`c${k}`} className="overflow-x-auto rounded-xl bg-ink/90 p-3 font-mono text-xs text-cream">{code.join("\n")}</pre>);
        code = null;
      } else {
        flush(k);
        code = [];
      }
      return;
    }
    if (code) { code.push(line); return; }
    const ul = line.match(/^\s*[-*•]\s+(.*)/);
    const ol = line.match(/^\s*\d+[.)]\s+(.*)/);
    if (ul || ol) {
      const ordered = !!ol;
      if (!list || list.ordered !== ordered) { flush(k); list = { ordered, items: [] }; }
      list.items.push((ul ?? ol)![1]);
      return;
    }
    flush(k);
    const h = line.match(/^#{1,4}\s+(.*)/);
    if (h) blocks.push(<p key={k} className="font-round font-bold">{inline(h[1], `h${k}`)}</p>);
    else if (line.trim()) blocks.push(<p key={k}>{inline(line, `p${k}`)}</p>);
  });
  flush(lines.length);
  if (code) blocks.push(<pre key="cend" className="overflow-x-auto rounded-xl bg-ink/90 p-3 font-mono text-xs text-cream">{(code as string[]).join("\n")}</pre>);
  return <div className="space-y-2">{blocks.map((b, i) => <Fragment key={i}>{b}</Fragment>)}</div>;
}
