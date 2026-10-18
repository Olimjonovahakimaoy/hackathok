import Link from "next/link";
import { Eyes } from "@/components/Brand";

export default function NotFound() {
  return (
    <main className="sky-bg grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <Eyes size={120} className="mx-auto animate-float" />
        <h1 className="mt-6 font-display text-6xl text-cream">404</h1>
        <p className="mt-2 font-semibold text-cream/85">Bu sahifa topilmadi yoki sizga ruxsat berilmagan.</p>
        <Link href="/" className="btn mt-6 bg-cream text-night hover:bg-white">Bosh sahifaga</Link>
      </div>
    </main>
  );
}
