// DB'den oku, yoksa fallback'e dus helper'lari.
// Public sayfalarda kullaniliyor - admin'den editable veri DB'de, default'lar
// statik HTML import'larinda.
import { prisma } from "@/lib/prisma";

// Belirli kategori slug'i icin DB'den title/description cek (locale degerini dondur).
export async function getCategoryFromDB(slug: string, locale: string) {
  try {
    const cat = await prisma.category.findUnique({
      where: { slug },
      select: { title: true, description: true, heroImage: true, published: true },
    });
    if (!cat || !cat.published) return null;
    const title = (cat.title as Record<string, string>)?.[locale];
    const desc = (cat.description as Record<string, string> | null)?.[locale];
    return {
      title: title ?? null,
      description: desc ?? null,
      heroImage: cat.heroImage,
    };
  } catch {
    return null;
  }
}

export async function getProductFromDB(slug: string, locale: string) {
  try {
    const p = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: { select: { slug: true, title: true } },
        images: { orderBy: { order: "asc" } },
      },
    });
    if (!p || !p.published) return null;
    const title = (p.title as Record<string, string>)?.[locale];
    const shortDesc = (p.shortDesc as Record<string, string> | null)?.[locale];
    const longDesc = (p.longDesc as Record<string, string> | null)?.[locale];
    const catTitle = (p.category.title as Record<string, string>)?.[locale];
    return {
      title: title ?? null,
      shortDesc: shortDesc ?? null,
      longDesc: longDesc ?? null,
      categorySlug: p.category.slug,
      categoryTitle: catTitle ?? null,
      images: p.images.map((i) => ({ url: i.url, alt: (i.alt as Record<string, string> | null)?.[locale] ?? "" })),
    };
  } catch {
    return null;
  }
}

export async function getStaticPageFromDB(slug: string, locale: string) {
  try {
    const p = await prisma.staticPage.findUnique({
      where: { slug },
      select: { title: true, contentHtml: true, metaDescription: true, published: true },
    });
    if (!p || !p.published) return null;
    return {
      title: (p.title as Record<string, string>)?.[locale] ?? null,
      contentHtml: (p.contentHtml as Record<string, string>)?.[locale] ?? null,
      metaDescription:
        (p.metaDescription as Record<string, string> | null)?.[locale] ?? null,
    };
  } catch {
    return null;
  }
}
