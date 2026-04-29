// i18n middleware - gelen her request'e dogru locale'i ekler
// ve lokalize pathname'leri cozer. Ayrica response'a x-pathname header
// ekler ki layout.tsx body class'i sayfa turune gore secebilsin.
//
// NOT: Next.js 16'da `middleware` dosyasi `proxy` olarak yeniden
// adlandirildi.

import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  // Once intl middleware'i calistir
  const response = intlMiddleware(request);

  // Pathname'i header olarak ekle (layout.tsx body class icin kullanir)
  if (response) {
    response.headers.set("x-pathname", request.nextUrl.pathname);
  }

  return response;
}

export const config = {
  // `/_next`, `/api`, `/admin`, statik dosyalar ve Next dahili path'leri atla.
  // Admin route'lari kendi auth middleware'ine sahip, locale prefix'i KOYMAYIZ.
  matcher: [
    "/((?!api|admin|_next|_vercel|.*\\..*).*)",
  ],
};
