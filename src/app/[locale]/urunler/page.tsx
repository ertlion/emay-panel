import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";

type PageProps = { params: Promise<{ locale: string }> };

function ProductsContent() {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold text-[color:var(--color-primary)]">
        {t("products")}
      </h1>
      <p className="mt-4 text-neutral-600">{tCommon("comingSoon")}</p>
    </div>
  );
}

export default async function ProductsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ProductsContent />;
}
