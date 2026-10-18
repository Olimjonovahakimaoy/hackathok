"use client";

import { useEffect, useRef } from "react";

/** Kursorga qaraydigan ko'zchalar (login sahifasi maskoti) */
export function TrackingEyes({ size = 120 }: { size?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const pupils = useRef<SVGGElement>(null);

  useEffect(() => {
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const svg = ref.current;
        const g = pupils.current;
        if (!svg || !g) return;
        const r = svg.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth / 2)));
        const dy = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight / 2)));
        g.setAttribute("transform", `translate(${dx * 9} ${dy * 10})`);
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <svg ref={ref} width={size} height={size / 2} viewBox="0 0 120 60" aria-hidden="true">
      <path d="M6 57 C6 20 17 3 31 3 C46 3 56 22 56 57 Z" fill="#0d4497" stroke="white" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M64 57 C64 20 75 3 89 3 C104 3 114 22 114 57 Z" fill="#0d4497" stroke="white" strokeWidth="3.5" strokeLinejoin="round" />
      <g ref={pupils} style={{ transition: "transform 120ms ease-out" }}>
        <g className="animate-blink" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
          <ellipse cx="31" cy="32" rx="7" ry="12" fill="#EBEFE0" />
          <ellipse cx="89" cy="32" rx="7" ry="12" fill="#EBEFE0" />
        </g>
      </g>
    </svg>
  );
}
