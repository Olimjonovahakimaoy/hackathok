import Link from "next/link";

/** Rasmdagi "ko'zchalar" — platforma maskoti */
export function Eyes({ size = 56, blink = true, className = "", fill = "#0d4497" }: { size?: number; blink?: boolean; className?: string; fill?: string }) {
  return (
    <svg width={size} height={size / 2} viewBox="0 0 120 60" className={className} aria-hidden="true">
      <g>
        <path d="M6 57 C6 20 17 3 31 3 C46 3 56 22 56 57 Z" fill={fill} stroke="white" strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M64 57 C64 20 75 3 89 3 C104 3 114 22 114 57 Z" fill={fill} stroke="white" strokeWidth="3.5" strokeLinejoin="round" />
      </g>
      <g className={blink ? "origin-center animate-blink" : ""} style={{ transformBox: "fill-box" }}>
        <ellipse cx="37" cy="31" rx="7" ry="12" fill="#EBEFE0" transform="rotate(12 37 31)" />
        <ellipse cx="95" cy="31" rx="7" ry="12" fill="#EBEFE0" transform="rotate(12 95 31)" />
      </g>
    </svg>
  );
}

export function Logo({ href = "/", light = true, compact = false }: { href?: string; light?: boolean; compact?: boolean }) {
  return (
    <Link href={href} className="group flex items-center gap-3" aria-label="SmartSchool bosh sahifa">
      <Eyes size={compact ? 40 : 48} fill={light ? "#0d4497" : "#407add"} />
      {!compact && (
        <span className={`font-display text-2xl leading-none tracking-tight ${light ? "text-cream" : "text-night"}`}>
          Smart<span className="text-green">School</span>
        </span>
      )}
    </Link>
  );
}

/** Rasmdagi manzara: tepaliklar, pushti dala, egri yashil yo'l */
export function Landscape({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 420" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f5fbf" />
          <stop offset="1" stopColor="#0f468f" />
        </linearGradient>
        <linearGradient id="field" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3cfe6" />
          <stop offset="1" stopColor="#e6a9d2" />
        </linearGradient>
        <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7fb558" />
          <stop offset="1" stopColor="#4f8a33" />
        </linearGradient>
      </defs>
      <path d="M0 210 C180 120 330 110 470 170 C560 210 640 150 760 120 C900 85 1050 130 1180 170 C1290 200 1370 160 1440 140 V300 H0 Z" fill="url(#hill)" opacity="0.9" />
      <path d="M0 250 C200 210 380 230 560 250 C760 270 980 230 1200 240 C1320 245 1400 235 1440 230 V420 H0 Z" fill="url(#field)" />
      <path d="M560 420 C600 360 700 330 760 300 C800 280 790 262 740 252 L770 250 C840 262 860 285 820 312 C760 352 720 380 700 420 Z" fill="#c9e88a" />
      <path d="M520 420 C560 360 660 330 730 300 C770 282 760 264 720 254 L748 251 C815 263 832 286 796 312 C740 350 690 380 668 420 Z" fill="url(#road)" />
    </svg>
  );
}
