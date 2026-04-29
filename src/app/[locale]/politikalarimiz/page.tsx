// politikalarimiz - emaypanel.com/politikalarimiz/index.html'den DOM-birebir port edildi.
// Kaynak: scripts/build-static-pages-html.mjs

import { renderStaticPage } from "@/lib/render-static-page";

type PageProps = { params: Promise<{ locale: string }> };

export default async function UpolitikalarimizPage({ params }: PageProps) {
  return renderStaticPage("politikalarimiz", params);
}
