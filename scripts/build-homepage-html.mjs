#!/usr/bin/env node
// Orijinal emaypanel.com/index.html'i al, body icerigini Next.js'te
// dangerouslySetInnerHTML ile kullanabilecegimiz hale getir.
// - URL'leri relative / route-aware yap
// - Back-to-top dahil
// - WPML switcher ve script tag'lerini cikar (kendi script yuklemesini layout yapiyor)
// - Sonucu src/app/[locale]/_homepage-static.ts dosyasina TS modulu olarak yaz
//
// Asama 2: cheerio ile TR text node'larini __T_namespace.key__ token'lariyla
// degistir. page.tsx runtime'da locale'e gore token'lari t(key) ile cozer.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

const SRC = resolve(PROJECT_ROOT, '../emaypanel-clone/emaypanel.com/index.html');
const OUT = resolve(PROJECT_ROOT, 'src/app/[locale]/_homepage-static.ts');

const html = readFileSync(SRC, 'utf8');

/**
 * Body'nin INNER icerigini cikar.
 */
function extractBody(src) {
  const bodyOpenMatch = src.match(/<body\b[^>]*>/);
  if (!bodyOpenMatch) throw new Error('body tag not found');
  const bodyOpenEnd = bodyOpenMatch.index + bodyOpenMatch[0].length;
  const bodyCloseIdx = src.lastIndexOf('</body>');
  if (bodyCloseIdx < 0) throw new Error('</body> not found');
  return src.slice(bodyOpenEnd, bodyCloseIdx);
}

let body = extractBody(html);

// ------------------------------------------------------------------
// 1) cheerio ile parse et ve i18n token replacement uygula
// ------------------------------------------------------------------

const $ = cheerio.load(body, { decodeEntities: false }, false);

const producedKeys = new Set();
function track(key) {
  producedKeys.add(key);
}

// <a>'nin direct TEXT node'larini tek token ile degistir, <i> vb. tag'leri koru.
function replaceAnchorText($a, key) {
  const token = `__T_${key}__`;
  track(key);
  let tokenAdded = false;
  $a.contents().each((_, node) => {
    if (node.type === 'text') {
      if (!tokenAdded) {
        $(node).replaceWith(token);
        tokenAdded = true;
      } else {
        $(node).remove();
      }
    }
  });
  if (!tokenAdded) {
    $a.prepend(token);
  }
}

function replaceElementText($el, key) {
  const token = `__T_${key}__`;
  track(key);
  $el.text(token);
}

function replaceElementHtml($el, key) {
  const token = `__T_${key}__`;
  track(key);
  $el.html(token);
}

// ------------------------------------------------------------------
// HEADER - Top-level nav
// ------------------------------------------------------------------

const topNavMap = {
  'Kurumsal': 'header.nav.corporate',
  'Ürünlerimiz': 'header.nav.products',
  'Dökümanlar': 'header.nav.documents',
  'İletişim': 'header.nav.contact',
};

$('#menu-main-menu > li').each((_, li) => {
  const $a = $(li).children('a').first();
  const txt = $a.text().replace(/\s+/g, ' ').trim();
  if (topNavMap[txt]) {
    replaceAnchorText($a, topNavMap[txt]);
  }
});

// Sub-menu items
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

$('#menu-main-menu a.dropdown-item').each((_, a) => {
  const $a = $(a);
  const txt = $a.text().replace(/\s+/g, ' ').trim();
  if (headerSubMap[txt]) {
    replaceAnchorText($a, headerSubMap[txt]);
  }
});

// ------------------------------------------------------------------
// HEADER - Iletisim Formu modal
// ------------------------------------------------------------------

$('.ekit-popup-btn__has-icon').each((_, el) => {
  const $el = $(el);
  if ($el.text().replace(/\s+/g, ' ').trim() === 'İletişim Formu') {
    replaceElementText($el, 'header.contactModal.toggle');
  }
});

$('.ekit-popup-modal__title').each((_, el) => {
  const $el = $(el);
  if ($el.text().replace(/\s+/g, ' ').trim() === 'İletişim Formu') {
    replaceElementText($el, 'contactModal.title');
  }
});

$('.ekit-popup-modal__subtitle').each((_, el) => {
  const $el = $(el);
  const txt = $el.text().replace(/\s+/g, ' ').trim();
  if (txt.startsWith('Aşağıdaki formu doldurun')) {
    replaceElementText($el, 'contactModal.subtitle');
  }
});

const formLabelMap = {
  'Ad Soyad *': 'contactModal.fullNameLabel',
  'Telefon Numarası *': 'contactModal.phoneLabel',
  'E-posta Adresi': 'contactModal.emailLabel',
  'Eklemek İstedikleriniz': 'contactModal.messageLabel',
};

$('.wpcf7-form label').each((_, el) => {
  const $el = $(el);
  const txt = $el.text().replace(/\s+/g, ' ').trim();
  if (formLabelMap[txt]) {
    replaceElementText($el, formLabelMap[txt]);
  }
});

// Submit input - value attribute'una token koy
$('input.wpcf7-submit').each((_, el) => {
  const $el = $(el);
  if ($el.attr('value') === 'Talep Gönder') {
    $el.attr('value', '__T_contactModal.submit__');
    track('contactModal.submit');
  }
});

// ------------------------------------------------------------------
// HEADER - "Bize Ulasin" buton (site-header icinde)
// ------------------------------------------------------------------

$('#site-header a.elementskit-btn').each((_, a) => {
  const $a = $(a);
  const txt = $a.text().replace(/\s+/g, ' ').trim();
  if (txt === 'Bize Ulaşın') {
    replaceAnchorText($a, 'header.contactCta');
  }
});

// ------------------------------------------------------------------
// HERO
// ------------------------------------------------------------------

// Eyebrow ("Rakipsiz Çözüm") + diger subtitle'lar
const subtitleMap = {
  'Rakipsiz Çözüm': 'homepage.hero.eyebrow',
  'Değerlerimiz': 'homepage.values.eyebrow',
  'Geleceğe Taahhüdümüz': 'homepage.cta.eyebrow',
};

$('.elementskit-section-subtitle').each((_, el) => {
  const $el = $(el);
  const txt = $el.text().replace(/\s+/g, ' ').trim();
  if (subtitleMap[txt]) {
    replaceElementText($el, subtitleMap[txt]);
  }
});

// "Smart Çözümler" iki kez — kombin (ilk) ve ges (ikinci).
const smartElements = $('.elementskit-section-subtitle').filter((_, el) =>
  $(el).text().replace(/\s+/g, ' ').trim() === 'Smart Çözümler'
);
if (smartElements.length >= 1) replaceElementText(smartElements.eq(0), 'homepage.kombin.eyebrow');
if (smartElements.length >= 2) replaceElementText(smartElements.eq(1), 'homepage.ges.eyebrow');

// Hero heading (h1, nested span ve br var)
$('h1.ekit-heading--title').each((_, el) => {
  const $el = $(el);
  const txt = $el.text().replace(/\s+/g, ' ').trim();
  if (txt.startsWith('Kalite,')) {
    replaceElementHtml($el, 'homepage.hero.title');
  }
});

// Hero description (p)
$('.elementor-element-03a856a p').each((_, el) => {
  const $el = $(el);
  if ($el.text().includes('Türkiye')) {
    replaceElementHtml($el, 'homepage.hero.description');
  }
});

// ------------------------------------------------------------------
// ÇATI / CEPHE SHOWCASE
// ------------------------------------------------------------------

$('h2.elementor-heading-title').each((_, el) => {
  const $el = $(el);
  const txt = $el.text().replace(/\s+/g, ' ').trim();
  if (txt === 'Çatı Panelleri') {
    replaceElementText($el, 'homepage.roofShowcase.heading');
  } else if (txt === 'Cephe Panelleri') {
    replaceElementText($el, 'homepage.facadeShowcase.heading');
  }
});

// "Poliüretan ve Poliizosiyanürat Dolgulu Paneller" x2 ve "Taş Yünü Dolgulu Paneller" x2
let puRoofDone = false;
let stoneRoofDone = false;
let puFacadeDone = false;
let stoneFacadeDone = false;

$('h4.elementor-heading-title').each((_, el) => {
  const $el = $(el);
  const txt = $el.text().replace(/\s+/g, ' ').trim();
  if (txt === 'Poliüretan ve Poliizosiyanürat Dolgulu Paneller') {
    if (!puRoofDone) {
      replaceElementText($el, 'homepage.roofShowcase.polyurethane.title');
      puRoofDone = true;
    } else if (!puFacadeDone) {
      replaceElementText($el, 'homepage.facadeShowcase.polyurethane.title');
      puFacadeDone = true;
    }
  } else if (txt === 'Taş Yünü Dolgulu Paneller') {
    if (!stoneRoofDone) {
      replaceElementText($el, 'homepage.roofShowcase.stoneWool.title');
      stoneRoofDone = true;
    } else if (!stoneFacadeDone) {
      replaceElementText($el, 'homepage.facadeShowcase.stoneWool.title');
      stoneFacadeDone = true;
    }
  }
});

// ------------------------------------------------------------------
// VALUES SECTION
// ------------------------------------------------------------------

// Buyuk baslik (h2.ekit-heading--title) - birden cok vardir, text'e bak
$('h2.ekit-heading--title').each((_, el) => {
  const $el = $(el);
  const txt = $el.text().replace(/\s+/g, ' ').trim();
  if (txt.startsWith('Etik ve Dürüst Ticaret')) {
    replaceElementHtml($el, 'homepage.values.heading');
  } else if (txt === 'Kombin Paneller' || txt.startsWith('Kombin Paneller')) {
    replaceElementHtml($el, 'homepage.kombin.title');
  } else if (txt.startsWith('Soğuk Oda Panelleri')) {
    replaceElementHtml($el, 'homepage.sogukOda.title');
  } else if (txt.startsWith('GES Uygulama Çözümleri')) {
    replaceElementHtml($el, 'homepage.ges.title');
  } else if (txt.startsWith('Uzun Vadeli')) {
    replaceElementHtml($el, 'homepage.cta.title');
  }
});

// Values description (elementor-element-cc67b03)
$('.elementor-element-cc67b03 p').each((_, el) => {
  const $el = $(el);
  if ($el.text().includes('Kurulduğu ilk günden beri')) {
    replaceElementHtml($el, 'homepage.values.description');
  }
});

// 6 deger karti baslik ve aciklama
const valueItemsTitleMap = {
  'Sürdürülebilirlik': 'homepage.values.items.sustainability.title',
  'Şeffaflık': 'homepage.values.items.transparency.title',
  'Hesap Verebilirlik': 'homepage.values.items.accountability.title',
  'Sosyal Sorumluluk': 'homepage.values.items.socialResponsibility.title',
  'Adil Yaklaşım': 'homepage.values.items.fairApproach.title',
  'Güvenilirlik': 'homepage.values.items.reliability.title',
};

$('.elementskit-info-box-title').each((_, el) => {
  const $el = $(el);
  const txt = $el.text().replace(/\s+/g, ' ').trim();
  if (valueItemsTitleMap[txt]) {
    replaceElementText($el, valueItemsTitleMap[txt]);
  }
});

const valueDescMap = [
  { match: 'Doğaya saygılı üretim gerçekleştirir', key: 'homepage.values.items.sustainability.description' },
  { match: 'Emay Sandviç Panel fabrikası', key: 'homepage.values.items.transparency.description' },
  { match: 'Kalite standartlarına uygun üretim yapar', key: 'homepage.values.items.accountability.description' },
  { match: 'Sadece sektöre değil ülkesine', key: 'homepage.values.items.socialResponsibility.description' },
  { match: 'Adil yaklaşım ilkesine inanan', key: 'homepage.values.items.fairApproach.description' },
];

$('.elementskit-infobox .box-body p').each((_, el) => {
  const $el = $(el);
  const txt = $el.text().replace(/\s+/g, ' ').trim();
  for (const { match, key } of valueDescMap) {
    if (txt.startsWith(match)) {
      replaceElementText($el, key);
      break;
    }
  }
});

// ------------------------------------------------------------------
// STICKY NAV (quick jump)
// ------------------------------------------------------------------

const stickyMap = {
  'Kombin Paneller': 'homepage.stickyNav.kombin',
  'Soğuk Oda Panelleri': 'homepage.stickyNav.sogukOda',
  'GES Uygulama Çözümleri': 'homepage.stickyNav.ges',
};

$('.ekit-stylish-list-content-title').each((_, el) => {
  const $el = $(el);
  const txt = $el.text().replace(/\s+/g, ' ').trim();
  if (stickyMap[txt]) {
    replaceElementText($el, stickyMap[txt]);
  }
});

// ------------------------------------------------------------------
// KOMBIN / SOGUK ODA / GES section descriptions
// ------------------------------------------------------------------

$('.elementor-element-1037167 p').each((_, el) => {
  const $el = $(el);
  if ($el.text().includes('Üstün performans sunan')) {
    replaceElementHtml($el, 'homepage.sogukOda.description');
  }
});

$('.elementor-element-0dba1b6 p').each((_, el) => {
  const $el = $(el);
  if ($el.text().includes('Çatı Paneli Kategorisinin')) {
    replaceElementHtml($el, 'homepage.ges.description');
  }
});

// ------------------------------------------------------------------
// STATS (funfact)
// ------------------------------------------------------------------

const statsMap = {
  'Tamamlanan Proje': 'homepage.stats.projects',
  'milyon m² üretim gücü': 'homepage.stats.productionArea',
  'Tamamlama Oranı': 'homepage.stats.completionRate',
  'Müşteri Memnuniyeti': 'homepage.stats.satisfaction',
};

$('.funfact-title').each((_, el) => {
  const $el = $(el);
  const txt = $el.text().replace(/\s+/g, ' ').trim();
  if (statsMap[txt]) {
    replaceElementText($el, statsMap[txt]);
  }
});

// ------------------------------------------------------------------
// CTA subtitle (duplicate <p> icerigi)
// ------------------------------------------------------------------

$('.elementor-element-d35455c .ekit-heading__description p').each((_, el) => {
  const $el = $(el);
  if ($el.text().includes('Uzun Vadeli')) {
    replaceElementText($el, 'homepage.cta.subtitle');
  }
});

// ------------------------------------------------------------------
// BUTONLARI TOPLU HANDLE ET
// (header/hero/values/kombin/soguk/ges/cta — hepsi elementskit-btn)
// Text'ine gore distribute edelim. Dikkat: bazi button'lar yukarida
// zaten handle edildi (header Bize Ulasin). Text artik token'li oldugu
// icin tekrar match etmeyecek.
// ------------------------------------------------------------------

$('a.elementskit-btn').each((_, a) => {
  const $a = $(a);
  const txt = $a.text().replace(/\s+/g, ' ').trim();
  if (txt === 'Daha Fazla Bilgi Alın') {
    replaceAnchorText($a, 'homepage.hero.cta');
  } else if (txt === 'Tümünü İncele') {
    replaceAnchorText($a, 'common.viewAll');
  } else if (txt === 'Hakkımızda') {
    replaceAnchorText($a, 'homepage.values.cta');
  } else if (txt === 'İncele') {
    replaceAnchorText($a, 'common.inspect');
  } else if (txt === 'Bize Ulaşın') {
    // Header Bize Ulasin zaten handle edildi, bu CTA bolumundeki
    replaceAnchorText($a, 'common.contactUs');
  }
});

// ------------------------------------------------------------------
// FOOTER
// ------------------------------------------------------------------

// Tagline
$('p.elementor-heading-title').each((_, el) => {
  const $el = $(el);
  const txt = $el.text().replace(/\s+/g, ' ').trim();
  if (txt === 'Anadolu Toprağından Gelen Güven') {
    replaceElementText($el, 'footer.tagline');
  }
});

// Section headings h5 ("Ürünlerimi" orijinal typo, "Ürünlerimiz" fallback)
const footerHeadingMap = {
  'Ürünlerimi': 'footer.productsHeading',
  'Ürünlerimiz': 'footer.productsHeading',
  'Kurumsal': 'footer.corporateHeading',
  'Bize Ulaşın': 'footer.contactHeading',
};

$('h5.elementor-heading-title').each((_, el) => {
  const $el = $(el);
  const txt = $el.text().replace(/\s+/g, ' ').trim();
  if (footerHeadingMap[txt]) {
    replaceElementText($el, footerHeadingMap[txt]);
  }
});

// Footer link texts
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

$('#site-footer .elementor-icon-list-text').each((_, el) => {
  const $el = $(el);
  const txt = $el.text().replace(/\s+/g, ' ').trim();
  if (footerLinkMap[txt]) {
    replaceElementText($el, footerLinkMap[txt]);
  }
});

// Adres/telefon (p.Demirağ OSB...) ve sirket adi (Emay Panel Sanayi...)
// - plan talimati: hard-coded kalsin. DOKUNMA.

// ------------------------------------------------------------------
// 2) HTML serialize ve regex post-processing
// ------------------------------------------------------------------

body = $.html();

// Script/style/noscript temizligi
body = body.replace(/<script\b[\s\S]*?<\/script>/gi, '');
body = body.replace(/<style\b[\s\S]*?<\/style>/gi, '');
body = body.replace(/<noscript\b[\s\S]*?<\/noscript>/gi, '');
body = body.replace(/<link\b[^>]*\brel=["']stylesheet["'][^>]*>/gi, '');
body = body.replace(/<link\b[^>]*>/gi, '');

// WPML footer switcher
body = body.replace(
  /<div\s+role="navigation"\s+aria-label="Language Switcher"[\s\S]*?<\/div>\s*(?=<link|<script|$)/,
  '',
);

// URL normalizasyonu
body = body.replace(/\bwp-content\/uploads\//g, '/uploads/');
body = body.replace(/https?:\/\/emaypanel\.com\/wp-content\/uploads\//g, '/uploads/');

const pageIdMap = {
  '26468': '/iletisim',
  '26469': '/hakkimizda',
  '26473': '/iletisim',
  '26811': '/',
};

body = body.replace(
  /(["'])index\.html@p=(\d+)\.html/g,
  (_m, quote, id) => `${quote}${pageIdMap[id] ?? `/?p=${id}`}`,
);

const slugMap = [
  ['hakkimizda.html', '/hakkimizda'],
  ['iletisim.html', '/iletisim'],
  ['kalite-belgelerimiz.html', '/kalite-belgelerimiz'],
  ['politikalarimiz.html', '/politikalarimiz'],
  ['kvkk.html', '/kvkk'],
  ['satis.html', '/satis'],
  ['is-basvurusu.html', '/is-basvurusu'],
  ['kisilerin-verilerinin-korunmasi-aydinlatma-metni.html', '/kvkk'],
];

for (const [wp, next] of slugMap) {
  body = body.replace(new RegExp(`(["'])${wp.replace(/\./g, '\\.')}`, 'g'), `$1${next}`);
}

body = body.replace(
  /(["'])kategori\/([^\/"']+)\/([^\/"']+)\/index\.html/g,
  (_m, q, parent, child) => `${q}/urunler/${parent}/${child}`,
);
body = body.replace(
  /(["'])kategori\/([^\/"']+)\/index\.html/g,
  (_m, q, slug) => `${q}/urunler/${slug}`,
);
body = body.replace(
  /(["'])kategori\/([^\/"']+)\.html/g,
  (_m, q, slug) => `${q}/urunler/${slug}`,
);

body = body.replace(/(["'])index\.html(#[^"']*)?(["'])/g, (_m, q1, hash = '', q2) => `${q1}/${hash || ''}${q2}`);

body = body.replace(/https?:\/\/emaypanel\.com\//g, '/');
body = body.replace(/https?:\/\/www\.emaypanel\.com\//g, '/');
body = body.replace(/https?:\/\/localhost:\d+\//g, '/');

body = body.replace(/href="\/#content"/g, 'href="#content"');
body = body.replace(/href="\/(#[^"']+)"/g, 'href="$1"');

body = body.replace(/action="[^"]*wp-admin[^"]*"/g, 'action="#"');
body = body.replace(/action="\/[^"]*wpcf7[^"]*"/g, 'action="#"');

body = body.replace(/href="\/#"/g, 'href="#"');

body = body.trim();

// ------------------------------------------------------------------
// 3) TS module olarak yaz
// ------------------------------------------------------------------

const tsContent =
  `// Auto-generated by scripts/build-homepage-html.mjs\n` +
  `// Kaynak: ../emaypanel-clone/emaypanel.com/index.html\n` +
  `// Degistirme: script'i yeniden calistir.\n` +
  `// Icerdigi __T_<namespace.key>__ token'lari runtime'da page.tsx\n` +
  `// tarafindan next-intl t() fonksiyonu ile cevirilere baglanir.\n\n` +
  `export const homepageHtml = ${JSON.stringify(body)};\n`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, tsContent, 'utf8');

// Token dogrulamasi
const tokenMatches = body.match(/__T_[a-zA-Z0-9_.]+__/g) || [];
const uniqueTokens = [...new Set(tokenMatches)];

console.log(`Wrote ${OUT}`);
console.log(`Size: ${(tsContent.length / 1024).toFixed(1)} KB`);
console.log(`Tracked keys: ${producedKeys.size}`);
console.log(`Tokens in output: ${tokenMatches.length} (${uniqueTokens.length} unique)`);
if (process.env.DEBUG) {
  console.log('Unique tokens:');
  uniqueTokens.sort().forEach((t) => console.log('  ', t));
}
