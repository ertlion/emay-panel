# Emay Panel i18n

Emay Panel kurumsal sitesinin 4 dilli (TR / EN / RU / AR) Next.js port'u.

## Tech Stack

- Next.js 16 (App Router) + React 19
- TypeScript (strict)
- Tailwind CSS v4
- next-intl v4 (pathname translation + RTL)
- lucide-react (ikonlar)

## Gelistirme

```bash
npm install
npm run dev
```

Varsayilan port: http://localhost:3000

## Dil URL'leri

| Dil | URL |
| --- | --- |
| Turkce | http://localhost:3000/tr |
| English | http://localhost:3000/en |
| Russian | http://localhost:3000/ru |
| Arabic (RTL) | http://localhost:3000/ar |

Root path (`/`) otomatik olarak tarayici diline gore `/tr` (default) veya uygun dile yonlendirir.

## Proje Yapisi

```
src/
  app/
    globals.css              # Tailwind v4 + Emay renk degiskenleri
    [locale]/                # Lokalize edilmis tum sayfalar
      layout.tsx             # Root layout (html/body burada)
      page.tsx               # Anasayfa
      hakkimizda/
      iletisim/
      urunler/
        [category]/
          [product]/
      is-basvurusu/
      kalite-belgelerimiz/
      politikalarimiz/
      kvkk/
      satis/
  components/                # Header, Footer, LanguageSwitcher, Hero vb.
  i18n/
    routing.ts               # locale config + pathname map
    navigation.ts            # Link, useRouter, usePathname
    request.ts               # getRequestConfig (messages loader)
  lib/
    utils.ts                 # cn() utility (clsx + twMerge)
  middleware.ts              # next-intl middleware

messages/
  tr.json
  en.json
  ru.json
  ar.json
```

## Dil Bazli Path Ornekleri

- Hakkimizda -> `/tr/hakkimizda`, `/en/about`, `/ru/o-nas`, `/ar/من-نحن`
- Urunler -> `/tr/urunler`, `/en/products`, `/ru/produktsiya`, `/ar/المنتجات`
- Iletisim -> `/tr/iletisim`, `/en/contact`, `/ru/kontakty`, `/ar/اتصل-بنا`

## Admin Paneli

`/admin/login` ile yonetici girisi. Default admin: `admin@emay.com` / `emay-admin-2026`
(prod'da degistir).

### Yerel Postgres ile development

```bash
# 1. Postgres baslat (Docker)
docker run -d --name emay-pg \
  -e POSTGRES_USER=emay \
  -e POSTGRES_PASSWORD=emay \
  -e POSTGRES_DB=emaypanel \
  -p 5432:5432 \
  postgres:16

# 2. .env dosyasi (otomatik olusturulmussa atla)
cp .env.example .env

# 3. Schema'yi DB'ye uygula
npm run db:migrate

# 4. Default admin + statik veri seed
npm run db:seed

# 5. Dev server
npm run dev
```

Sonra: `http://localhost:3000/admin/login`

### Coolify Deployment

#### 1. Postgres kaynagi
Coolify proje icinde **+ New Resource → PostgreSQL** olustur. Coolify
`DATABASE_URL`'i otomatik uretir; bunu app'e baglarken kullanacagiz.

#### 2. Application
**+ New Resource → Application** ekle:
- Source: bu git repo
- Build pack: **Dockerfile** (otomatik tespit edilir)
- Port: **3000**
- Domain: opsiyonel — bos birakilirsa Coolify default subdomain ile
  (`emay-xxx.coolify.app` gibi) acilir; sonra domain eklenebilir.

#### 3. Environment Variables
Application → Environment ekranindan:

| Anahtar | Deger |
|---|---|
| `DATABASE_URL` | Postgres kaynaktan kopyala (Coolify "Connect" -> URL) |
| `AUTH_SECRET` | `openssl rand -base64 32` ile uret (terminal'de) |
| `NEXTAUTH_URL` | Coolify'in verdigi public URL (https://...coolify.app) |
| `ADMIN_EMAIL` | `admin@emay.com` (default) |
| `ADMIN_PASSWORD` | guclu parola (ilk deploy sonra degistir) |
| `RUN_SEED` | `true` (ilk deploy) - tekrarda `false` |

#### 4. Deploy
- "Deploy" butonu → Dockerfile build edilir (~3-5 dk)
- Container basladiktan sonra `docker-entrypoint.sh` calisir:
  1. **DB schema push** (migrations yoksa `prisma db push`, varsa `migrate deploy`)
  2. **Idempotent seed** (default admin + 7 kategori + 22 urun + 7 sayfa + 287 i18n key)
  3. **Next.js standalone server** baslar
- Logs'tan "==> Starting Next.js standalone server..." mesajini gor
- Public URL'e git → site acilir, `/admin/login` → admin@emay.com / parolaniz

#### 5. Sonraki deploy'lar
- Git push → Coolify webhook ile otomatik build/deploy
- Schema degisirse Prisma `db push` otomatik uygular
- `RUN_SEED=false` set ederek seed atlanabilir (zaten idempotent ama hizlandirir)

## Bilinen TODO

- [x] Admin paneli skeleton (login + dashboard)
- [ ] CRUD UI: urunler, kategoriler, sayfalar (placeholder mevcut)
- [ ] Public site DB'den okusun (su an: build-time statik HTML)
- [ ] Medya yukleme (image upload)
- [ ] HeroVideo YouTube ID'si admin'den editable
- [ ] SEO metadata'lari (generateMetadata)
