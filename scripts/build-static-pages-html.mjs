#!/usr/bin/env node
// Statik sayfalari (hakkimizda, iletisim, is-basvurusu, kalite-belgelerimiz,
// kvkk, politikalarimiz, satis) emaypanel-clone mirror'indan port eder.
//
// Tek bir _static-pages.ts dosyasi uretir:
//   export const staticPages: Record<string, string> = { hakkimizda: "...", ... }
//
// Pattern build-category-html.mjs ile birebir ayni:
// - cheerio ile body extract
// - header/footer/iletisim modal token'lari (paylasilan map'ler)
// - script/style/noscript/link strip
// - URL normalizasyon (relative path prefix'leri tolere edilir)

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const MIRROR_ROOT = resolve(PROJECT_ROOT, '../emaypanel-clone/emaypanel.com');
const OUT = resolve(PROJECT_ROOT, 'src/app/[locale]/_static-pages.ts');

const PAGES = [
  'hakkimizda',
  'iletisim',
  'is-basvurusu',
  'kalite-belgelerimiz',
  'kvkk',
  'politikalarimiz',
  'satis',
];

// ------------------------------------------------------------------
// Shared token map'leri (homepage/kategori/urun ile birebir ayni)
// ------------------------------------------------------------------
const topNavMap = {
  'Kurumsal': 'header.nav.corporate',
  'Ürünlerimiz': 'header.nav.products',
  'Dökümanlar': 'header.nav.documents',
  'İletişim': 'header.nav.contact',
};

const headerSubMap = {
  'Hakkımızda': 'header.nav.about',
  'Misyon & Vizyon': 'header.nav.missionVision',
  'Değerlerimiz': 'header.nav.values',
  'Yönetim İlkelerimiz': 'header.nav.managementPrinciples',
  'Politikalarımız': 'header.nav.policies',
  'Çatı Panelleri': 'header.nav.roofPanels',
  'Cephe Panelleri': 'header.nav.facadePanels',
  'Kombin Paneller': 'header.nav.combinedPanels',
  'Soğuk Oda Panelleri': 'header.nav.coldRoomPanels',
  'GES Uygulama Çözümleri': 'header.nav.gesSolutions',
  'Trapezler': 'header.nav.trapezoids',
  'Tamamlayıcı Ürünler': 'header.nav.complementary',
  'Poliüretan ve Poliizosiyanürat Dolgulu Paneller': 'header.nav.polyurethanePanels',
  'Taş Yünü Dolgulu Paneller': 'header.nav.stoneWoolPanels',
  'Kalite Belgelerimiz': 'header.nav.qualityCertificates',
};

const formLabelMap = {
  'Ad Soyad *': 'contactModal.fullNameLabel',
  'Telefon Numarası *': 'contactModal.phoneLabel',
  'E-posta Adresi': 'contactModal.emailLabel',
  'Eklemek İstedikleriniz': 'contactModal.messageLabel',
};

const footerHeadingMap = {
  'Ürünlerimi': 'footer.productsHeading',
  'Ürünlerimiz': 'footer.productsHeading',
  'Kurumsal': 'footer.corporateHeading',
  'Bize Ulaşın': 'footer.contactHeading',
};

const footerLinkMap = {
  'Çatı Panelleri': 'footer.products.roof',
  'Cephe Panelleri': 'footer.products.facade',
  'Kombin Paneller': 'footer.products.combined',
  'Soğuk Oda Panelleri': 'footer.products.coldRoom',
  'GES Uygulama Çözümleri': 'footer.products.ges',
  'Trapezler': 'footer.products.trapezoids',
  'Tamamlayıcı Ürünler': 'footer.products.complementary',
  'Hakkımızda': 'footer.corporate.about',
  'Misyon & Vizyon': 'footer.corporate.missionVision',
  'Değerlerimiz': 'footer.corporate.values',
  'Yönetim İlkelerimiz': 'footer.corporate.principles',
  'Politikalarımız': 'footer.corporate.policies',
  'KVKK Metni': 'footer.legal.kvkk',
  'İş Başvurusu': 'footer.legal.careers',
};

// ------------------------------------------------------------------
// Utilities
// ------------------------------------------------------------------
function extractBody(src) {
  const bodyOpenMatch = src.match(/<body\b[^>]*>/);
  if (!bodyOpenMatch) throw new Error('body tag not found');
  const bodyOpenEnd = bodyOpenMatch.index + bodyOpenMatch[0].length;
  const bodyCloseIdx = src.lastIndexOf('</body>');
  if (bodyCloseIdx < 0) throw new Error('</body> not found');
  return src.slice(bodyOpenEnd, bodyCloseIdx);
}

function makeTracker() {
  const set = new Set();
  return {
    set,
    track(key) {
      set.add(key);
    },
  };
}

function replaceAnchorText($, $a, key, track) {
  const token = `__T_${key}__`;
  track(key);
  let added = false;
  $a.contents().each((_, node) => {
    if (node.type === 'text') {
      if (!added) {
        $(node).replaceWith(token);
        added = true;
      } else {
        $(node).remove();
      }
    }
  });
  if (!added) $a.prepend(token);
}

function replaceElementText($el, key, track) {
  const token = `__T_${key}__`;
  track(key);
  $el.text(token);
}

// Mirror'in WooCommerce post-ID -> slug haritasi.
// Statik sayfalardaki ?p=ID linkleri bu map ile gercek URL'lere cevrilir.
const PRODUCT_POST_IDS = {
  '27176': ['cati-panelleri', 'emay-smart-5s-gv'],
  '27177': ['cati-panelleri', 'emay-smart-3h-dv'],
  '27178': ['cati-panelleri', 'emay-smart-5h-dv'],
  '27180': ['cati-panelleri', 'emay-smart-5h-dv-ctp'],
  '27181': ['cati-panelleri', 'emay-smart-5h-dvt'],
  '27182': ['cati-panelleri', 'emay-smart-membranli-5h-dvt-pvc-tpo'],
  '27183': ['cephe-panelleri', 'emay-smart-gv'],
  '27184': ['cephe-panelleri', 'emay-smart-7f'],
  '27185': ['cephe-panelleri', 'emay-smart-8s'],
  '27187': ['cephe-panelleri', 'emay-smart-dv'],
  '27188': ['cephe-panelleri', 'emay-smart-gvt'],
  '27189': ['cephe-panelleri', 'emay-smart-dvt'],
  '27190': ['cephe-panelleri', 'emay-smart-akustik-gvt'],
  '27191': ['soguk-oda-panelleri', 'emay-smart-cs-crw-soguk-oda-paneli'],
  '27195': ['tamamlayici-urunler', 'c-profil'],
  '27196': ['cati-panelleri', 'emay-smart-5h-dv-pvc-tpo'],
  '27197': ['cati-panelleri', 'emay-smart-akustik-5h-dvt'],
  '27198': ['kombin-paneller', 'emay-smart-gv-standart-emay-smart-7f'],
  '27199': ['kombin-paneller', 'emay-smart-gv-micro-emay-smart-7f'],
  '27200': ['kombin-paneller', 'emay-smart-gv-micro-emay-smart-gv-standart'],
  '27201': ['kombin-paneller', 'emay-smart-8s-emay-smart-gv-standart'],
  '27206': ['trapezler', 'trapez-saclar'],
};

const PAGE_ID_MAP = {
  '26468': '/iletisim',
  '26469': '/hakkimizda',
  '26473': '/iletisim',
  '26811': '/',
  '27031': '/politikalarimiz',
};

function resolvePageId(id) {
  if (PAGE_ID_MAP[id]) return PAGE_ID_MAP[id];
  if (PRODUCT_POST_IDS[id]) {
    const [cat, slug] = PRODUCT_POST_IDS[id];
    return `/urunler/${cat}/${slug}`;
  }
  return `/?p=${id}`;
}

// ------------------------------------------------------------------
// Per-page processor
// ------------------------------------------------------------------
function processPageHtml(slug, rawHtml) {
  const { set: producedKeys, track } = makeTracker();
  let body = extractBody(rawHtml);

  const $ = cheerio.load(body, { decodeEntities: false }, false);

  // Header top nav
  $('#menu-main-menu > li').each((_, li) => {
    const $a = $(li).children('a').first();
    const txt = $a.text().replace(/\s+/g, ' ').trim();
    if (topNavMap[txt]) replaceAnchorText($, $a, topNavMap[txt], track);
  });
  $('#menu-main-menu a.dropdown-item').each((_, a) => {
    const $a = $(a);
    const txt = $a.text().replace(/\s+/g, ' ').trim();
    if (headerSubMap[txt]) replaceAnchorText($, $a, headerSubMap[txt], track);
  });

  // Contact modal
  $('.ekit-popup-btn__has-icon').each((_, el) => {
    const $el = $(el);
    if ($el.text().replace(/\s+/g, ' ').trim() === 'İletişim Formu') {
      replaceElementText($el, 'header.contactModal.toggle', track);
    }
  });
  $('.ekit-popup-modal__title').each((_, el) => {
    const $el = $(el);
    if ($el.text().replace(/\s+/g, ' ').trim() === 'İletişim Formu') {
      replaceElementText($el, 'contactModal.title', track);
    }
  });
  $('.ekit-popup-modal__subtitle').each((_, el) => {
    const $el = $(el);
    if ($el.text().replace(/\s+/g, ' ').trim().startsWith('Aşağıdaki formu doldurun')) {
      replaceElementText($el, 'contactModal.subtitle', track);
    }
  });
  $('.wpcf7-form label').each((_, el) => {
    const $el = $(el);
    const txt = $el.text().replace(/\s+/g, ' ').trim();
    if (formLabelMap[txt]) replaceElementText($el, formLabelMap[txt], track);
  });
  $('input.wpcf7-submit').each((_, el) => {
    const $el = $(el);
    if ($el.attr('value') === 'Talep Gönder') {
      $el.attr('value', '__T_contactModal.submit__');
      track('contactModal.submit');
    }
  });

  // Header CTA
  $('#site-header a.elementskit-btn').each((_, a) => {
    const $a = $(a);
    const txt = $a.text().replace(/\s+/g, ' ').trim();
    if (txt === 'Bize Ulaşın') replaceAnchorText($, $a, 'header.contactCta', track);
  });

  // Footer
  $('p.elementor-heading-title').each((_, el) => {
    const $el = $(el);
    if ($el.text().replace(/\s+/g, ' ').trim() === 'Anadolu Toprağından Gelen Güven') {
      replaceElementText($el, 'footer.tagline', track);
    }
  });
  $('h5.elementor-heading-title').each((_, el) => {
    const $el = $(el);
    const txt = $el.text().replace(/\s+/g, ' ').trim();
    if (footerHeadingMap[txt]) replaceElementText($el, footerHeadingMap[txt], track);
  });
  $('#site-footer .elementor-icon-list-text').each((_, el) => {
    const $el = $(el);
    const txt = $el.text().replace(/\s+/g, ' ').trim();
    if (footerLinkMap[txt]) replaceElementText($el, footerLinkMap[txt], track);
  });

  // ------------------------------------------------------------------
  // Serialize ve post-processing
  // ------------------------------------------------------------------
  body = $.html();

  body = body.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  body = body.replace(/<style\b[\s\S]*?<\/style>/gi, '');
  body = body.replace(/<noscript\b[\s\S]*?<\/noscript>/gi, '');
  body = body.replace(/<link\b[^>]*\brel=["']stylesheet["'][^>]*>/gi, '');
  body = body.replace(/<link\b[^>]*>/gi, '');

  // WPML language switcher
  body = body.replace(
    /<div\s+role="navigation"\s+aria-label="Language Switcher"[\s\S]*?<\/div>\s*(?=<link|<script|$)/,
    '',
  );

  // URL normalizasyonu - SIRA KRITIK
  body = body.replace(/https?:\/\/(?:www\.)?emaypanel\.com\/wp-content\/uploads\//g, '/uploads/');
  body = body.replace(/\/\/(?:www\.)?emaypanel\.com\/wp-content\/uploads\//g, '/uploads/');
  body = body.replace(/(?:\.\.\/)+(?:wp-content\/)?uploads\//g, '/uploads/');
  body = body.replace(/\bwp-content\/uploads\//g, '/uploads/');

  // page-id linkleri (relative prefix tolere)
  body = body.replace(
    /(["'])(?:[^"']*\/)?index\.html@p=(\d+)\.html/g,
    (_m, q, id) => `${q}${resolvePageId(id)}`,
  );
  body = body.replace(
    /(["'])\/?\?p=(\d+)(["'#])/g,
    (_m, q1, id, q2) => `${q1}${resolvePageId(id)}${q2}`,
  );

  // Statik slug map (relative prefix tolere)
  const slugMap = [
    ['hakkimizda.html', '/hakkimizda'],
    ['iletisim.html', '/iletisim'],
    ['kalite-belgelerimiz.html', '/kalite-belgelerimiz'],
    ['politikalarimiz.html', '/politikalarimiz'],
    ['kvkk.html', '/kvkk'],
    ['satis.html', '/satis'],
    ['is-basvurusu.html', '/is-basvurusu'],
    ['kisilerin-verilerinin-korunmasi-aydinlatma-metni.html', '/kvkk'],
    ['contact-sales.html', '/satis'],
  ];
  for (const [wp, next] of slugMap) {
    body = body.replace(
      new RegExp(`(["'])(?:[^"']*\\/)?${wp.replace(/\./g, '\\.')}`, 'g'),
      `$1${next}`,
    );
  }

  // contact-sales/, kisilerin-verilerinin-...-metni/ klasor yollari
  body = body.replace(
    /(["'])(?:\.\.\/)?contact-sales\/index\.html/g,
    (_m, q) => `${q}/satis`,
  );
  body = body.replace(
    /(["'])(?:\.\.\/)?kisilerin-verilerinin-korunmasi-aydinlatma-metni\/index\.html/g,
    (_m, q) => `${q}/kvkk`,
  );

  // kategori/<slug>(/<sub>)?/index.html -> /urunler/<slug>
  body = body.replace(
    /(["'])[^"']*kategori\/([^\/"']+)\/[^\/"']+\/index\.html/g,
    (_m, q, parent) => `${q}/urunler/${parent}`,
  );
  body = body.replace(
    /(["'])[^"']*kategori\/([^\/"']+)\/index\.html/g,
    (_m, q, s) => `${q}/urunler/${s}`,
  );
  body = body.replace(
    /(["'])[^"']*kategori\/([^\/"']+)\.html/g,
    (_m, q, s) => `${q}/urunler/${s}`,
  );

  // ürün/<slug>/index.html -> /urunler/<cat>/<slug>
  const slugToCat = Object.fromEntries(
    Object.values(PRODUCT_POST_IDS).map(([c, s]) => [s, c]),
  );
  body = body.replace(
    /(["'])[^"']*(?:ürün|%C3%BCr%C3%BCn)\/([a-z0-9-]+)\/index\.html/g,
    (_m, q, productSlug) => {
      const cat = slugToCat[productSlug] || 'cati-panelleri';
      return `${q}/urunler/${cat}/${productSlug}`;
    },
  );

  // shop arsivi
  body = body.replace(
    /(["'])(?:\.\.\/)+shop\/index\.html/g,
    (_m, q) => `${q}/urunler`,
  );

  // index.html (anasayfa) referanslari
  body = body.replace(/(["'])[^"']*(?:\.\.\/)+index\.html(#[^"']*)?(["'])/g, (_m, q1, hash = '', q2) => `${q1}/${hash || ''}${q2}`);
  body = body.replace(/(["'])index\.html(#[^"']*)?(["'])/g, (_m, q1, hash = '', q2) => `${q1}/${hash || ''}${q2}`);

  // Mutlak URL -> relative
  body = body.replace(/https?:\/\/emaypanel\.com\//g, '/');
  body = body.replace(/https?:\/\/www\.emaypanel\.com\//g, '/');
  body = body.replace(/https?:\/\/localhost:\d+\//g, '/');

  // href="/#..." -> href="#..."
  body = body.replace(/href="\/#([^"']*)"/g, 'href="#$1"');
  body = body.replace(/href="\/#"/g, 'href="#"');

  // Form action sanitize
  body = body.replace(/action="[^"]*wp-admin[^"]*"/g, 'action="#"');
  body = body.replace(/action="\/[^"]*wpcf7[^"]*"/g, 'action="#"');

  return { html: body.trim(), keys: producedKeys };
}

// ------------------------------------------------------------------
// Main
// ------------------------------------------------------------------
const pages = {};
const globalKeys = new Set();

for (const slug of PAGES) {
  const src = resolve(MIRROR_ROOT, slug, 'index.html');
  const raw = readFileSync(src, 'utf8');
  const { html, keys } = processPageHtml(slug, raw);
  pages[slug] = html;
  keys.forEach((k) => globalKeys.add(k));

  const tokens = html.match(/__T_[a-zA-Z0-9_.]+__/g) || [];
  const unique = new Set(tokens);
  console.log(
    `${slug.padEnd(28)}  size: ${(html.length / 1024).toFixed(1)} KB  tokens: ${tokens.length} (${unique.size} unique)`,
  );
}

const tsBody =
  `// Auto-generated by scripts/build-static-pages-html.mjs\n` +
  `// Kaynak: ../emaypanel-clone/emaypanel.com/<slug>/index.html\n` +
  `// Tekrar uretmek icin: node scripts/build-static-pages-html.mjs\n\n` +
  `export const staticPages: Record<string, string> = ${JSON.stringify(pages, null, 0)};\n`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, tsBody, 'utf8');

console.log(`\nWrote ${OUT}`);
console.log(`Total file size: ${(tsBody.length / 1024).toFixed(1)} KB`);
console.log(`Unique i18n keys across all static pages: ${globalKeys.size}`);
