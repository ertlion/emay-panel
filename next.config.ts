import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// next-intl plugin: i18n request config dosyamizi isaret eder
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Standalone yerine basit prod build (Prisma path issue'lari icin daha guvenilir).
  // output: "standalone",
  // Next.js 16'nin strict typedRoutes'u admin route'larini [locale] altinda
  // bekliyor; admin ayri kok route oldugu icin devre disi.
  typedRoutes: false,
  // Dev mode'da footer'da goruan yesil "build activity" indicator'ini gizle.
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
