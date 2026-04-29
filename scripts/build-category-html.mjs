#!/usr/bin/env node
// Orijinal emaypanel.com/kategori/<slug>/index.html dosyalarindan
// body icerigini cek, i18n token'lari uygula, Next.js path'lerini normalize et
// ve src/app/[locale]/urunler/[category]/_categories-static.ts dosyasini uret.
//
// build-homepage-html.mjs ile ayni pattern:
// - cheerio ile parse et, text node'lari __T_namespace.key__ token'lariyla degistir
// - script/style/noscript/link tag'lerini cikar
// - URL normalizasyonu (mirror path'leri -> Next.js route'lari)
// - Marka adlari (Emay Smart ...), adres, email, telefon HARD-CODED kalir.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

const MIRROR_ROOT = resolve(PROJECT_ROOT, '../emaypanel-clone/emaypanel.com/kategori');
const OUT = resolve(PROJECT_ROOT, 'src/app/[locale]/urunler/[category]/_categories-static.ts');

const CATEGORIES = [
  'cati-panelleri',
  'cephe-panelleri',
  'kombin-paneller',
  'soguk-oda-panelleri',
  'ges-uygulama-cozumleri',
  'trapezler',
  'tamamlayici-urunler',
];

// Slug bazli baslik (i18n key `category.<slug>.title`).
// Script icerisinde bu slug'lari kullanarak hangi baslik/aciklamanin
// hangi key'e gidecegini belirliyoruz.
const CATEGORY_META = {
  'cati-panelleri': { titleKey: 'category.cati.title' },
  'cephe-panelleri': { titleKey: 'category.cephe.title' },
  'kombin-paneller': { titleKey: 'category.kombin.title' },
  'soguk-oda-panelleri': { titleKey: 'category.sogukOda.title' },
  'ges-uygulama-cozumleri': { titleKey: 'category.ges.title' },
  'trapezler': { titleKey: 'category.trapez.title' },
  'tamamlayici-urunler': { titleKey: 'category.tamamlayici.title' },
};

// Ayni header/footer icinde tekrar eden menu ogelerini token'lara cevir.
// Bu map homepage'de de kullaniliyor - sayfalarda birebir ayni metin
// sayfalarda birebir ayni tokenla gelmesi icin aynen yazdik.
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

// Woocommerce sort select options. Yonlendirmelere dokunmuyoruz,
// sadece text'i token'liyoruz.
const sortMap = {
  'Varsayılan Sıralama': 'catalog.sort.default',
  'En çok satılana göre sırala': 'catalog.sort.popularity',
  'Ortalama puana göre sırala': 'catalog.sort.rating',
  'En yeniye göre sırala': 'catalog.sort.newest',
  'Fiyata göre sırala: Düşükten yükseğe': 'catalog.sort.priceAsc',
  'Fiyata göre sırala: Yüksekten düşüğe': 'catalog.sort.priceDesc',
};

function extractBody(src) {
  const bodyOpenMatch = src.match(/<body\b[^>]*>/);
  if (!bodyOpenMatch) throw new Error('body tag not found');
  const bodyOpenEnd = bodyOpenMatch.index + bodyOpenMatch[0].length;
  const bodyCloseIdx = src.lastIndexOf('</body>');
  if (bodyCloseIdx < 0) throw new Error('</body> not found');
  return src.slice(bodyOpenEnd, bodyCloseIdx);
}

function createTracker() {
  const set = new Set();
  return {
    set,
    track(key) {
      set.add(key);
    },
  };
}

/**
 * cheerio $a element'inin text node'larini tek token ile degistir,
 * icerdigi <i>, <span> vb. tag'leri korur.
 */
function replaceAnchorText($, $a, key, track) {
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

function replaceElementText($el, key, track) {
  const token = `__T_${key}__`;
  track(key);
  $el.text(token);
}

function replaceElementHtml($el, key, track) {
  const token = `__T_${key}__`;
  track(key);
  $el.html(token);
}

function processCategoryHtml(slug, rawHtml) {
  const { set: producedKeys, track } = createTracker();
  let body = extractBody(rawHtml);

  const $ = cheerio.load(body, { decodeEntities: false }, false);

  // --------------------------------------------------------------
  // HEADER - top nav
  // --------------------------------------------------------------
  $('#menu-main-menu > li').each((_, li) => {
    const $a = $(li).children('a').first();
    const txt = $a.text().replace(/\s+/g, ' ').trim();
    if (topNavMap[txt]) {
      replaceAnchorText($, $a, topNavMap[txt], track);
    }
  });

  $('#menu-main-menu a.dropdown-item').each((_, a) => {
    const $a = $(a);
    const txt = $a.text().replace(/\s+/g, ' ').trim();
    if (headerSubMap[txt]) {
      replaceAnchorText($, $a, headerSubMap[txt], track);
    }
  });

  // --------------------------------------------------------------
  // HEADER - Contact Form modal
  // --------------------------------------------------------------
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
    if (formLabelMap[txt]) {
      replaceElementText($el, formLabelMap[txt], track);
    }
  });

  $('input.wpcf7-submit').each((_, el) => {
    const $el = $(el);
    if ($el.attr('value') === 'Talep Gönder') {
      $el.attr('value', '__T_contactModal.submit__');
      track('contactModal.submit');
    }
  });

  // Header "Bize Ulasin" CTA
  $('#site-header a.elementskit-btn').each((_, a) => {
    const $a = $(a);
    const txt = $a.text().replace(/\s+/g, ' ').trim();
    if (txt === 'Bize Ulaşın') {
      replaceAnchorText($, $a, 'header.contactCta', track);
    }
  });

  // --------------------------------------------------------------
  // BREADCRUMB - Home + Ürünler + <category>
  // KeyDesign/WooCommerce markup:
  //   <nav class="breadcrumb-trail"><ul class="trail-items">
  //     <li class="trail-item trail-begin"><a><span>Home</span></a></li>
  //     <li class="trail-item"><a><span>Ürünler</span></a></li>
  //     <li class="trail-item trail-end"><span><span>Çatı Panelleri</span></span></li>
  //   </ul></nav>
  // --------------------------------------------------------------
  const meta = CATEGORY_META[slug];

  $('.breadcrumb-trail .trail-item a span').each((_, el) => {
    const $el = $(el);
    const txt = $el.text().replace(/\s+/g, ' ').trim();
    if (txt === 'Home' || txt === 'Ana Sayfa') {
      replaceElementText($el, 'breadcrumb.home', track);
    } else if (txt === 'Ürünler' || txt === 'Ürünlerimiz') {
      replaceElementText($el, 'breadcrumb.products', track);
    }
  });

  // Aktif (son) breadcrumb — kategori ismi
  $('.breadcrumb-trail .trail-end span span').each((_, el) => {
    const $el = $(el);
    const txt = $el.text().replace(/\s+/g, ' ').trim();
    if (txt.length > 0) {
      replaceElementText($el, meta.titleKey, track);
    }
  });

  // --------------------------------------------------------------
  // H1 - kategori basligi
  // --------------------------------------------------------------
  $('h1.entry-title, h1.page-title, h1.woocommerce-products-header__title').each((_, el) => {
    replaceElementText($(el), meta.titleKey, track);
  });

  // --------------------------------------------------------------
  // Woocommerce result count: "8 sonucun tümü gösteriliyor"
  // --------------------------------------------------------------
  $('.woocommerce-result-count').each((_, el) => {
    const $el = $(el);
    const txt = $el.text().replace(/\s+/g, ' ').trim();
    // Sayiyi ayir: "8 sonucun tümü gösteriliyor" veya "1-9 / 12 sonuc gösteriliyor"
    const mAll = txt.match(/^(\d+)\s+sonucun tümü gösteriliyor$/);
    if (mAll) {
      // Token icine {count} placeholder koy ki runtime'da degistirebilelim.
      // Basitlik adina mevcut sayiyi koruyarak sadece label'i token'liyoruz.
      $el.text(`${mAll[1]} __T_catalog.showingAll__`);
      track('catalog.showingAll');
      return;
    }
    const mRange = txt.match(/^(\d+)[-–](\d+)\s*\/\s*(\d+)\s+sonuç gösteriliyor$/);
    if (mRange) {
      $el.text(`${mRange[1]}-${mRange[2]} / ${mRange[3]} __T_catalog.showingRange__`);
      track('catalog.showingRange');
      return;
    }
  });

  // --------------------------------------------------------------
  // Woocommerce sort select
  // --------------------------------------------------------------
  $('select.orderby option').each((_, opt) => {
    const $opt = $(opt);
    const txt = $opt.text().replace(/\s+/g, ' ').trim();
    if (sortMap[txt]) {
      $opt.text(`__T_${sortMap[txt]}__`);
      track(sortMap[txt]);
    }
  });

  // "Shop order" label for accessibility (varsa)
  $('label[for="woocommerce-orderby"], .woocommerce-ordering label').each((_, el) => {
    const $el = $(el);
    const txt = $el.text().replace(/\s+/g, ' ').trim();
    if (txt === 'Shop order' || txt === 'Sirala') {
      replaceElementText($el, 'catalog.sort.label', track);
    }
  });

  // --------------------------------------------------------------
  // Urun kartlarinda "Devamını oku" buton
  // --------------------------------------------------------------
  $('a.button.product_type_simple, a.button.product_type_external, a.button.add_to_cart_button, a.added_to_cart').each((_, a) => {
    const $a = $(a);
    const txt = $a.text().replace(/\s+/g, ' ').trim();
    if (txt === 'Devamını oku' || txt === 'Sepete ekle' || txt === 'Devamini oku') {
      // Ikisinde de ayni token kullaniyoruz — sayfada sadece "Devamini oku" olacak.
      replaceAnchorText($, $a, 'catalog.readMore', track);
    }
  });

  // --------------------------------------------------------------
  // FOOTER
  // --------------------------------------------------------------
  $('p.elementor-heading-title').each((_, el) => {
    const $el = $(el);
    const txt = $el.text().replace(/\s+/g, ' ').trim();
    if (txt === 'Anadolu Toprağından Gelen Güven') {
      replaceElementText($el, 'footer.tagline', track);
    }
  });

  $('h5.elementor-heading-title').each((_, el) => {
    const $el = $(el);
    const txt = $el.text().replace(/\s+/g, ' ').trim();
    if (footerHeadingMap[txt]) {
      replaceElementText($el, footerHeadingMap[txt], track);
    }
  });

  $('#site-footer .elementor-icon-list-text').each((_, el) => {
    const $el = $(el);
    const txt = $el.text().replace(/\s+/g, ' ').trim();
    if (footerLinkMap[txt]) {
      replaceElementText($el, footerLinkMap[txt], track);
    }
  });

  // --------------------------------------------------------------
  // Serialize ve post-processing
  // --------------------------------------------------------------
  body = $.html();

  // Script/style/noscript temizligi (layout zaten yukluyor)
  body = body.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  body = body.replace(/<style\b[\s\S]*?<\/style>/gi, '');
  body = body.replace(/<noscript\b[\s\S]*?<\/noscript>/gi, '');
  body = body.replace(/<link\b[^>]*\brel=["']stylesheet["'][^>]*>/gi, '');
  body = body.replace(/<link\b[^>]*>/gi, '');

  // WPML footer language switcher
  body = body.replace(
    /<div\s+role="navigation"\s+aria-label="Language Switcher"[\s\S]*?<\/div>\s*(?=<link|<script|$)/,
    '',
  );

  // URL normalizasyonu - SIRA KRITIK (build-product-html.mjs ile ayni)
  body = body.replace(/https?:\/\/(?:www\.)?emaypanel\.com\/wp-content\/uploads\//g, '/uploads/');
  body = body.replace(/\/\/(?:www\.)?emaypanel\.com\/wp-content\/uploads\//g, '/uploads/');
  body = body.replace(/(?:\.\.\/)+(?:wp-content\/)?uploads\//g, '/uploads/');

  // Mirror icinde kullanilan ilgisiz page-id url patterns.
  // Mirror'da relative path prefix'i olabilir (../../, ../).
  const pageIdMap = {
    '26468': '/iletisim',
    '26469': '/hakkimizda',
    '26473': '/iletisim',
    '26811': '/',
  };
  // Urun post-ID'leri -> /urunler/<cat>/<slug> route'una git.
  const productPostIds = buildProductPostIdMap();
  const productCats = buildProductCategoryMap();
  function resolvePageId(id) {
    if (pageIdMap[id]) return pageIdMap[id];
    const slugForId = productPostIds[id];
    if (slugForId) {
      const cat = productCats[slugForId] || slug;
      return `/urunler/${cat}/${slugForId}`;
    }
    return `/?p=${id}`;
  }
  body = body.replace(
    /(["'])(?:[^"']*\/)?index\.html@p=(\d+)\.html/g,
    (_m, q, id) => `${q}${resolvePageId(id)}`,
  );
  // /?p=ID formatindaki linkler (kategori sayfasindaki urun karti linkleri)
  body = body.replace(
    /(["'])\/?\?p=(\d+)(["'#])/g,
    (_m, q1, id, q2) => `${q1}${resolvePageId(id)}${q2}`,
  );

  // Statik slug map (homepage build script ile ayni).
  // Relative prefix'i (../, ../../) tolere et.
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
    body = body.replace(
      new RegExp(`(["'])(?:[^"']*\\/)?${wp.replace(/\./g, '\\.')}`, 'g'),
      `$1${next}`,
    );
  }

  // kategori/<slug>.html -> /urunler/<slug>
  body = body.replace(
    /(["'])[^"']*kategori\/([^\/"']+)\/index\.html/g,
    (_m, q, s) => `${q}/urunler/${s}`,
  );
  body = body.replace(
    /(["'])[^"']*kategori\/([^\/"']+)\.html/g,
    (_m, q, s) => `${q}/urunler/${s}`,
  );

  // Mirror'da sub-category linkleri RELATIVE format kullaniyor:
  //   href="poliuretan-ve-poliizosiyanurat-dolgulu-paneller/index.html"
  //   href="../cephe-panelleri/poliuretan-...-cephe-panelleri/index.html"
  //   href="../ges-uygulama-cozumleri/index.html"  (kardes kategori)
  //   href="../cati-panelleri.html"                (kardes kategori - .html dosyasi)
  // Bu link'leri Next.js'te ayri route olarak yapmak yerine
  // parent (ana) kategoriye yonlendirir.
  //
  // 1) ../<other-cat>/<sub>/index.html -> /urunler/<other-cat> (cross-category sub)
  body = body.replace(
    /(["'])(?:\.\.\/)+([a-z0-9-]+)\/[^"'\/]+\/index\.html/g,
    (_m, q, otherCat) => `${q}/urunler/${otherCat}`,
  );
  // 2) ../<sister-cat>/index.html -> /urunler/<sister-cat> (kardes kategori klasoru)
  body = body.replace(
    /(["'])(?:\.\.\/)+([a-z0-9-]+)\/index\.html/g,
    (_m, q, sisterCat) => `${q}/urunler/${sisterCat}`,
  );
  // 3) ../<sister-cat>.html (relative .html) -> /urunler/<sister-cat>
  body = body.replace(
    /(["'])(?:\.\.\/)+([a-z][a-z0-9-]+)\.html/g,
    (_m, q, sisterCat) => `${q}/urunler/${sisterCat}`,
  );
  // 4) ../../shop/index.html veya benzeri shop arsivi -> /urunler
  body = body.replace(
    /(["'])(?:\.\.\/)+shop\/index\.html/g,
    (_m, q) => `${q}/urunler`,
  );
  // 5) <sub>/index.html (current category klasoru altinda relative) -> /urunler/<slug>
  body = body.replace(
    /(["'])([a-z][a-z0-9-]+)\/index\.html/g,
    (_m, q) => `${q}/urunler/${slug}`,
  );

  // ürün/<slug>/index.html -> /urunler/<category>/<slug>
  // (category bilgisini burada bilmiyoruz; urun build'de daha gelismis yapiyoruz.
  //  Kategori sayfasinda link'ler zaten dogrudan urune gidiyor —
  //  category slug'ini dogru eslesen ile replace ediyoruz.)
  const productToCategory = buildProductCategoryMap();
  body = body.replace(
    /(["'])[^"']*(?:ürün|%C3%BCr%C3%BCn)\/([a-z0-9-]+)\/index\.html/g,
    (_m, q, productSlug) => {
      const cat = productToCategory[productSlug] || slug;
      return `${q}/urunler/${cat}/${productSlug}`;
    },
  );

  // index.html (anasayfa) referanslari
  body = body.replace(/(["'])[^"']*(?:\.\.\/)+index\.html(#[^"']*)?(["'])/g, (_m, q1, hash = '', q2) => `${q1}/${hash || ''}${q2}`);
  body = body.replace(/(["'])index\.html(#[^"']*)?(["'])/g, (_m, q1, hash = '', q2) => `${q1}/${hash || ''}${q2}`);

  // Mutlak URL'leri relative yap
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

// Urun -> kategori haritasi (breadcrumb'tan elle cikarildi, stabil)
function buildProductCategoryMap() {
  return {
    'c-profil': 'tamamlayici-urunler',
    'emay-smart-3h-dv': 'cati-panelleri',
    'emay-smart-5h-dv': 'cati-panelleri',
    'emay-smart-5h-dv-ctp': 'cati-panelleri',
    'emay-smart-5h-dv-pvc-tpo': 'cati-panelleri',
    'emay-smart-5h-dvt': 'cati-panelleri',
    'emay-smart-5s-gv': 'cati-panelleri', // GES altinda da liste gosterilir ama kanonik catidir
    'emay-smart-7f': 'cephe-panelleri',
    'emay-smart-8s': 'cephe-panelleri',
    'emay-smart-8s-emay-smart-gv-standart': 'kombin-paneller',
    'emay-smart-akustik-5h-dvt': 'cati-panelleri',
    'emay-smart-akustik-gvt': 'cephe-panelleri',
    'emay-smart-cs-crw-soguk-oda-paneli': 'soguk-oda-panelleri',
    'emay-smart-dv': 'cephe-panelleri',
    'emay-smart-dvt': 'cephe-panelleri',
    'emay-smart-gv': 'cephe-panelleri',
    'emay-smart-gv-micro-emay-smart-7f': 'kombin-paneller',
    'emay-smart-gv-micro-emay-smart-gv-standart': 'kombin-paneller',
    'emay-smart-gv-standart-emay-smart-7f': 'kombin-paneller',
    'emay-smart-gvt': 'cephe-panelleri',
    'emay-smart-membranli-5h-dvt-pvc-tpo': 'cati-panelleri',
    'trapez-saclar': 'trapezler',
  };
}

// Mirror'daki WooCommerce post-ID -> slug haritasi.
// Kategori sayfasindaki urun karti linkleri /?p=27177 formundadir,
// bu map'le gercek /urunler/<cat>/<slug> URL'ine cevrilir.
// Mirror'in <body class="postid-XXXXX..."> attribute'undan cikarildi.
function buildProductPostIdMap() {
  return {
    '27176': 'emay-smart-5s-gv',
    '27177': 'emay-smart-3h-dv',
    '27178': 'emay-smart-5h-dv',
    '27180': 'emay-smart-5h-dv-ctp',
    '27181': 'emay-smart-5h-dvt',
    '27182': 'emay-smart-membranli-5h-dvt-pvc-tpo',
    '27183': 'emay-smart-gv',
    '27184': 'emay-smart-7f',
    '27185': 'emay-smart-8s',
    '27187': 'emay-smart-dv',
    '27188': 'emay-smart-gvt',
    '27189': 'emay-smart-dvt',
    '27190': 'emay-smart-akustik-gvt',
    '27191': 'emay-smart-cs-crw-soguk-oda-paneli',
    '27195': 'c-profil',
    '27196': 'emay-smart-5h-dv-pvc-tpo',
    '27197': 'emay-smart-akustik-5h-dvt',
    '27198': 'emay-smart-gv-standart-emay-smart-7f',
    '27199': 'emay-smart-gv-micro-emay-smart-7f',
    '27200': 'emay-smart-gv-micro-emay-smart-gv-standart',
    '27201': 'emay-smart-8s-emay-smart-gv-standart',
    '27206': 'trapez-saclar',
  };
}

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

const pages = {};
const globalKeys = new Set();

for (const slug of CATEGORIES) {
  const src = resolve(MIRROR_ROOT, slug, 'index.html');
  const raw = readFileSync(src, 'utf8');
  const { html, keys } = processCategoryHtml(slug, raw);
  pages[slug] = html;
  keys.forEach((k) => globalKeys.add(k));
  const tokens = html.match(/__T_[a-zA-Z0-9_.]+__/g) || [];
  const unique = new Set(tokens);
  console.log(`${slug.padEnd(28)}  size: ${(html.length / 1024).toFixed(1)} KB  tokens: ${tokens.length} (${unique.size} unique)`);
}

// --------------------------------------------------------------
// TS module yaz
// --------------------------------------------------------------
const tsBody =
  `// Auto-generated by scripts/build-category-html.mjs\n` +
  `// Kaynak: ../emaypanel-clone/emaypanel.com/kategori/<slug>/index.html\n` +
  `// Tekrar uretmek icin: node scripts/build-category-html.mjs\n` +
  `// Her export edilen HTML icinde __T_<namespace.key>__ token'lari\n` +
  `// runtime'da next-intl messages'tan cevrilir.\n\n` +
  `export const categoryPages: Record<string, string> = ${JSON.stringify(pages, null, 0)};\n`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, tsBody, 'utf8');

console.log(`\nWrote ${OUT}`);
console.log(`Total file size: ${(tsBody.length / 1024).toFixed(1)} KB`);
console.log(`Unique i18n keys across all categories: ${globalKeys.size}`);
if (process.env.DEBUG) {
  [...globalKeys].sort().forEach((k) => console.log('  ', k));
}
