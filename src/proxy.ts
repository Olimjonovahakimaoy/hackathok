import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, homeFor, verifySession } from "@/lib/session";
import type { Role } from "@/lib/types";

const AREAS: Record<string, Role> = {
  "/student": "student",
  "/teacher": "teacher",
  "/parent": "parent",
  "/admin": "admin",
};

/**
 * Tezkor yo'naltirish: sessiyasiz foydalanuvchi himoyalangan sahifaga kira olmaydi,
 * boshqa rol sahifasiga kirsa o'z sahifasiga qaytariladi.
 * Ma'lumotga kirish huquqi har bir sahifa va API ichida qayta tekshiriladi.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/login" || pathname === "/") {
    if (session) return NextResponse.redirect(new URL(homeFor(session.role), req.url));
    if (pathname === "/") return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.next();
  }

  const area = Object.keys(AREAS).find((p) => pathname === p || pathname.startsWith(p + "/"));
  if (area || pathname.startsWith("/account")) {
    if (!session) {
      const url = new URL("/login", req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (area && AREAS[area] !== session.role) {
      return NextResponse.redirect(new URL(homeFor(session.role), req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/student/:path*", "/teacher/:path*", "/parent/:path*", "/admin/:path*", "/account/:path*"],
};
