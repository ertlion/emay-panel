// satis - emaypanel.com/satis/index.html'den DOM-birebir port edildi.
// Kaynak: scripts/build-static-pages-html.mjs

import { renderStaticPage } from "@/lib/render-static-page";

type PageProps = { params: Promise<{ locale: string }> };

export default async function UsatisPage({ params }: PageProps) {
  return renderStaticPage("satis", params);
}
