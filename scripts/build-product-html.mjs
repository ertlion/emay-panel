#!/usr/bin/env node
// Orijinal emaypanel.com/ürün/<slug>/index.html dosyalarindan
// body icerigini cek, i18n token'lari uygula, Next.js path'lerini normalize et
// ve src/app/[locale]/urunler/[category]/[product]/_products-static.ts dosyasini uret.
//
// build-category-html.mjs ile ayni pattern:
// - cheerio ile parse et, text node'lari __T_namespace.key__ token'lariyla degistir
// - script/style/noscript/link tag'lerini cikar
// - URL normalizasyonu (mirror path'leri -> Next.js route'lari)
// - Marka adlari (Emay Smart ...), adres, email, telefon, RAL/teknik deger HARD-CODED kalir.
//
// Ek olarak (kategoriden farkli):
// - Product short description HTML blogu tek bir HTML-token ile degistirilir.
// - Product long description (tab-description) HTML blogu tek bir HTML-token ile degistirilir.
// - product_meta "Stok kodu:" / "Kategoriler:" label'lari token'lanir.
// - Breadcrumb kategori + alt-kategori linkleri token'lanir (global header.nav.*).

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

// unicode "ürün" dizini
const MIRROR_ROOT = resolve(PROJECT_ROOT, '../emaypanel-clone/emaypanel.com/ürün');
const OUT = resolve(
  PROJECT_ROOT,
  'src/app/[locale]/urunler/[category]/[product]/_products-static.ts',
);

// 22 urun slug'i. Kategori map'i breadcrumb'dan cikarildi (asagidaki
// PRODUCT_TO_CATEGORY ile kontrol et; degisen durumlarda build hata atar).
const PRODUCT_SLUGS = [
  'c-profil',
  'emay-smart-3h-dv',
  'emay-smart-5h-dv',
  'emay-smart-5h-dv-ctp',
  'emay-smart-5h-dv-pvc-tpo',
  'emay-smart-5h-dvt',
  'emay-smart-5s-gv',
  'emay-smart-7f',
  'emay-smart-8s',
  'emay-smart-8s-emay-smart-gv-standart',
  'emay-smart-akustik-5h-dvt',
  'emay-smart-akustik-gvt',
  'emay-smart-cs-crw-soguk-oda-paneli',
  'emay-smart-dv',
  'emay-smart-dvt',
  'emay-smart-gv',
  'emay-smart-gv-micro-emay-smart-7f',
  'emay-smart-gv-micro-emay-smart-gv-standart',
  'emay-smart-gv-standart-emay-smart-7f',
  'emay-smart-gvt',
  'emay-smart-membranli-5h-dvt-pvc-tpo',
  'trapez-saclar',
];

// Breadcrumb'dan elle dogrulanmis kanonik kategori eslestirmeleri.
// Kullanicinin fallback map'iyle 6 urunde fark var - breadcrumb kanoniktir.
// Detay rapor sonunda.
const PRODUCT_TO_CATEGORY = {
  'c-profil': 'tamamlayici-urunler',
  'emay-smart-3h-dv': 'cati-panelleri',
  'emay-smart-5h-dv': 'cati-panelleri',
  'emay-smart-5h-dv-ctp': 'cati-panelleri',
  'emay-smart-5h-dv-pvc-tpo': 'cati-panelleri',
  'emay-smart-5h-dvt': 'cati-panelleri',
  'emay-smart-5s-gv': 'cati-panelleri',
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

// ------------------------------------------------------------------
// Shared token map'leri - homepage/kategori ile birebir ayni
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

// Breadcrumb icin 2. ve 3. seviye kategori etiketleri
const breadcrumbCategoryMap = {
  'Çatı Panelleri': 'header.nav.roofPanels',
  'Cephe Panelleri': 'header.nav.facadePanels',
  'Kombin Paneller': 'header.nav.combinedPanels',
  'Soğuk Oda Panelleri': 'header.nav.coldRoomPanels',
  'GES Uygulama Çözümleri': 'header.nav.gesSolutions',
  'Trapezler': 'header.nav.trapezoids',
  'Tamamlayıcı Ürünler': 'header.nav.complementary',
  'Poliüretan ve Poliizosiyanürat Dolgulu Paneller': 'header.nav.polyurethanePanels',
  'Taş Yünü Dolgulu Paneller': 'header.nav.stoneWoolPanels',
};

// ------------------------------------------------------------------
// Utility
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

// cheerio $a element'inin text node'larini tek token ile degistir.
// Ic <i>, <span> vb. tag'leri korur.
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

// ------------------------------------------------------------------
// Main processor
// ------------------------------------------------------------------
function processProductHtml(slug, rawHtml) {
  const { set: producedKeys, track } = makeTracker();
  let body = extractBody(rawHtml);

  const $ = cheerio.load(body, { decodeEntities: false }, false);

  // --------------------------------------------------------------
  // HEADER
  // --------------------------------------------------------------
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

  // Header CTA "Bize Ulasin"
  $('#site-header a.elementskit-btn').each((_, a) => {
    const $a = $(a);
    const txt = $a.text().replace(/\s+/g, ' ').trim();
    if (txt === 'Bize Ulaşın') replaceAnchorText($, $a, 'header.contactCta', track);
  });

  // --------------------------------------------------------------
  // WOOCOMMERCE BREADCRUMB
  //   <nav class="woocommerce-breadcrumb">
  //     <a>Ana Sayfa</a> / <a>Çatı Panelleri</a> / <a>Poliüretan ...</a> / Emay Smart 5H DV
  //   </nav>
  // Ic text node'lari kategori label'larini tasiyor - direkt text olarak.
  // cheerio selector: nav.woocommerce-breadcrumb > a
  // --------------------------------------------------------------
  $('nav.woocommerce-breadcrumb > a').each((_, a) => {
    const $a = $(a);
    const txt = $a.text().replace(/\s+/g, ' ').trim();
    if (txt === 'Ana Sayfa' || txt === 'Home') {
      replaceAnchorText($, $a, 'breadcrumb.home', track);
    } else if (breadcrumbCategoryMap[txt]) {
      replaceAnchorText($, $a, breadcrumbCategoryMap[txt], track);
    }
  });

  // Breadcrumb'in son element'i (text node, link'siz) urun adi - SARMA.

  // --------------------------------------------------------------
  // PRODUCT H1 (product_title) - marka adi, SARMA
  // --------------------------------------------------------------
  // (dokunulmaz)

  // --------------------------------------------------------------
  // Product price - bos (`<p class="price"></p>`), sar.

  // --------------------------------------------------------------
  // Short description - tek token, HTML icerik
  // --------------------------------------------------------------
  const shortKey = `product.${slug}.shortDesc`;
  const $short = $('.woocommerce-product-details__short-description').first();
  if ($short.length > 0) {
    const innerHtml = $short.html() || '';
    if (innerHtml.trim().length > 0) {
      $short.html(`__T_${shortKey}__`);
      track(shortKey);
    }
  }

  // --------------------------------------------------------------
  // product_meta: "Stok kodu:" label, "Kategoriler:" label
  //   <div class="product_meta">
  //     <span class="sku_wrapper">Stok kodu: <span class="sku">...</span></span>
  //     <span class="posted_in">Kategoriler: <a>...</a>, <a>...</a></span>
  //   </div>
  // --------------------------------------------------------------
  $('.product_meta .sku_wrapper').each((_, el) => {
    const $el = $(el);
    // Sadece ilk text node "Stok kodu: " - onu degistir, <span class="sku"> korur.
    $el.contents().each((_, node) => {
      if (node.type === 'text' && /Stok kodu:/.test(node.data)) {
        $(node).replaceWith('__T_product.stockCodeLabel__ ');
        track('product.stockCodeLabel');
      }
    });
  });

  $('.product_meta .posted_in').each((_, el) => {
    const $el = $(el);
    $el.contents().each((_, node) => {
      if (node.type === 'text' && /Kategoriler:/.test(node.data)) {
        // "Kategoriler: " -> token + bosluk (sonrasindaki <a>'lar aynen kalir)
        $(node).replaceWith('__T_product.categoriesLabel__ ');
        track('product.categoriesLabel');
      }
    });
    // Ic anchor'lar kategori/alt-kategori: zaten headerSubMap'te tanimli
    $el.find('a').each((_, a) => {
      const $a = $(a);
      const txt = $a.text().replace(/\s+/g, ' ').trim();
      if (breadcrumbCategoryMap[txt]) {
        replaceAnchorText($, $a, breadcrumbCategoryMap[txt], track);
      }
    });
  });

  // --------------------------------------------------------------
  // Description tabs
  //   <li class="description_tab"><a>Açıklama</a></li>
  //   <div id="tab-description"><h2>Açıklama</h2> ...</div>
  // --------------------------------------------------------------
  $('.description_tab a, .wc-tabs .description_tab a').each((_, a) => {
    const $a = $(a);
    const txt = $a.text().replace(/\s+/g, ' ').trim();
    if (txt === 'Açıklama') {
      replaceAnchorText($, $a, 'product.descriptionTab', track);
    }
  });

  // "Açıklama" h2 baslik + long description HTML blogu
  const $tab = $('#tab-description').first();
  if ($tab.length > 0) {
    // h2 baslik icin token
    $tab.find('> h2').each((_, h2) => {
      const $h2 = $(h2);
      const txt = $h2.text().replace(/\s+/g, ' ').trim();
      if (txt === 'Açıklama') replaceElementText($h2, 'product.descriptionTab', track);
    });

    // Geri kalan tum HTML'i tek bir HTML-token ile degistir.
    // Token value runtime'da HTML olarak yorumlanir (dangerouslySetInnerHTML icinde).
    // h2 token'ini koruyoruz, onu silip ayri yerde tutmak yerine
    // long description'u ayri bir wrapper ile isaretleyelim:
    // Strateji: h2'yi birakip, sonraki tum cocuklari tek bir wrapper div icine
    // al ve o div'in icine token koy.
    const longKey = `product.${slug}.longDesc`;
    const $h2 = $tab.find('> h2').first();
    if ($h2.length > 0) {
      // h2'den sonraki tum nodelar'i sil, yerine tek bir token div koy
      let $cur = $h2.next();
      while ($cur.length > 0) {
        const $next = $cur.next();
        $cur.remove();
        $cur = $next;
      }
      $h2.after(`<div class="emay-product-longdesc">__T_${longKey}__</div>`);
      track(longKey);
    } else {
      // h2 yoksa tum icerigi token ile degistir
      $tab.html(`<div class="emay-product-longdesc">__T_${longKey}__</div>`);
      track(longKey);
    }
  }

  // --------------------------------------------------------------
  // Related products section
  //   <section class="related products"><h2>İlgili ürünler</h2>
  //     <ul class="products">
  //       <li class="product"><a><h2 class="woocommerce-loop-product__title">Marka Adi</h2></a>
  //         <a class="button">Devamını oku</a>
  //       </li>
  //     </ul>
  //   </section>
  // Marka adlari SARMA. "İlgili ürünler" ve "Devamını oku" token'lanir.
  // --------------------------------------------------------------
  $('section.related h2').each((_, el) => {
    const $el = $(el);
    const txt = $el.text().replace(/\s+/g, ' ').trim();
    if (txt === 'İlgili ürünler') {
      replaceElementText($el, 'product.relatedHeading', track);
    }
  });

  $('section.related a.button').each((_, a) => {
    const $a = $(a);
    const txt = $a.text().replace(/\s+/g, ' ').trim();
    if (txt === 'Devamını oku') {
      replaceAnchorText($, $a, 'catalog.readMore', track);
    }
  });

  // --------------------------------------------------------------
  // FOOTER
  // --------------------------------------------------------------
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

  // --------------------------------------------------------------
  // Serialize ve post-processing
  // --------------------------------------------------------------
  body = $.html();

  // Short + long desc orijinal HTML'lerini yakalayip ayri bir objeye topla
  // (messages tr.json'a eklemek icin). Bunun icin $.html()'den onceki durumu
  // saklamamiz lazim - tekrar bir cheerio load ile yapiyoruz.
  // Daha basit yaklasim: rawHtml icinden regex ile cek.
  //
  // Ama burada $.html() sonrasinda token'lar yerindedir; orijinal HTML'i
  // ayri bir $ load'dan cekelim.

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

  // URL normalizasyonu - normalizeDescHtml ile ayni sirada
  body = body.replace(/https?:\/\/(?:www\.)?emaypanel\.com\/wp-content\/uploads\//g, '/uploads/');
  body = body.replace(/\/\/(?:www\.)?emaypanel\.com\/wp-content\/uploads\//g, '/uploads/');
  body = body.replace(/(?:\.\.\/)+(?:wp-content\/)?uploads\//g, '/uploads/');

  const pageIdMap = {
    '26468': '/iletisim',
    '26469': '/hakkimizda',
    '26473': '/iletisim',
    '26811': '/',
  };
  // Urun post-ID -> /urunler/<cat>/<slug>. Mirror'in <body class="postid-...">
  // attribute'undan cikarildi. Kategori sayfasindaki gibi burada da ilgili
  // urunler bolumunde ayni patternler var.
  const productPostIds = {
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
  function resolvePageIdProduct(id) {
    if (pageIdMap[id]) return pageIdMap[id];
    const slugForId = productPostIds[id];
    if (slugForId) {
      const cat = PRODUCT_TO_CATEGORY[slugForId] || 'cati-panelleri';
      return `/urunler/${cat}/${slugForId}`;
    }
    return `/?p=${id}`;
  }
  // Relative prefix'i (../, ../../) tolere et — urun sayfasi 3 derin oldugu icin gerekli.
  body = body.replace(
    /(["'])(?:[^"']*\/)?index\.html@p=(\d+)\.html/g,
    (_m, q, id) => `${q}${resolvePageIdProduct(id)}`,
  );
  body = body.replace(
    /(["'])\/?\?p=(\d+)(["'#])/g,
    (_m, q1, id, q2) => `${q1}${resolvePageIdProduct(id)}${q2}`,
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
    body = body.replace(
      new RegExp(`(["'])(?:[^"']*\\/)?${wp.replace(/\./g, '\\.')}`, 'g'),
      `$1${next}`,
    );
  }

  // kategori/<cat>/<sub>/index.html -> /urunler/<cat> (alt-kategori klasoru
  // Next.js tarafinda yok, direkt ana kategoriye yonlendir)
  body = body.replace(
    /(["'])[^"']*kategori\/([^\/"']+)\/([^\/"']+)\/index\.html/g,
    (_m, q, parent /* sub */) => `${q}/urunler/${parent}`,
  );
  body = body.replace(
    /(["'])[^"']*kategori\/([^\/"']+)\/index\.html/g,
    (_m, q, s) => `${q}/urunler/${s}`,
  );
  body = body.replace(
    /(["'])[^"']*kategori\/([^\/"']+)\.html/g,
    (_m, q, s) => `${q}/urunler/${s}`,
  );

  // Mirror'da urun sayfasindan sub-category'lere RELATIVE link var:
  //   href="../../kategori/cati-panelleri/poliuretan-.../index.html"
  // Yukaridaki regex onu zaten /urunler/<parent>'a yonlendiriyor.
  // Bir de tek-kategori relative linkleri (../../kategori/<slug>/) icin:
  body = body.replace(
    /(["'])(?:\.\.\/)+kategori\/([a-z0-9-]+)\/index\.html/g,
    (_m, q, s) => `${q}/urunler/${s}`,
  );

  // shop arsivi -> /urunler
  body = body.replace(
    /(["'])(?:\.\.\/)+shop\/index\.html/g,
    (_m, q) => `${q}/urunler`,
  );

  // ürün/<slug>/index.html -> /urunler/<category>/<slug>
  body = body.replace(
    /(["'])[^"']*(?:ürün|%C3%BCr%C3%BCn)\/([a-z0-9-]+)\/index\.html/g,
    (_m, q, productSlug) => {
      const cat = PRODUCT_TO_CATEGORY[productSlug] || 'cati-panelleri';
      return `${q}/urunler/${cat}/${productSlug}`;
    },
  );

  // index.html referanslari - yukari dizin prefix'i dahil
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
// Short + long description HTML'lerini cek (cevirilere eklemek icin).
// Raw HTML uzerinde ikinci bir cheerio pass yapilir.
// ------------------------------------------------------------------
function extractDescriptions(rawHtml) {
  const body = extractBody(rawHtml);
  const $ = cheerio.load(body, { decodeEntities: false }, false);

  const $short = $('.woocommerce-product-details__short-description').first();
  const shortHtml = $short.length > 0 ? ($short.html() || '').trim() : '';

  // Long desc: #tab-description icindeki <h2> haric geri kalan HTML
  const $tab = $('#tab-description').first();
  let longHtml = '';
  if ($tab.length > 0) {
    const $clone = $tab.clone();
    $clone.find('> h2').remove();
    longHtml = ($clone.html() || '').trim();
  }

  return {
    shortHtml: normalizeDescHtml(shortHtml),
    longHtml: normalizeDescHtml(longHtml),
  };
}

// Description HTML'ini Next.js icin uygun hale getir:
// - URL'ler relative
// - wp-content/uploads -> /uploads
// - emaypanel.com mutlak -> relative
// - ../../index.html (mirror anasayfa) -> /
// - .html sonu olan WordPress sayfalar -> /<slug>
function normalizeDescHtml(html) {
  if (!html) return '';
  let out = html;
  // SIRA KRITIK: once mutlak/protocol-relative wp-content/uploads, sonra mutlak emaypanel.com,
  // sonra relative wp-content/uploads. Yanlis sira //uploads/ malformed URL uretir.
  out = out.replace(/https?:\/\/(?:www\.)?emaypanel\.com\/wp-content\/uploads\//g, '/uploads/');
  out = out.replace(/\/\/(?:www\.)?emaypanel\.com\/wp-content\/uploads\//g, '/uploads/');
  out = out.replace(/https?:\/\/(?:www\.)?emaypanel\.com\//g, '/');
  out = out.replace(/\/\/(?:www\.)?emaypanel\.com\//g, '/');
  out = out.replace(/\bwp-content\/uploads\//g, '/uploads/');
  // Kalan //uploads/... malformed URL'leri (eski generated icerikten) duzelt
  out = out.replace(/(["'(])\/\/uploads\//g, '$1/uploads/');

  // Relative anasayfa linkleri: ../../index.html -> /
  out = out.replace(
    /(["'])(?:\.\.\/)+index\.html(#[^"']*)?(["'])/g,
    (_m, q1, hash = '', q2) => `${q1}/${hash || ''}${q2}`,
  );

  // Statik sayfa slug'lari (mirror'da .html dosyasi olarak servis ediliyor)
  const slugMap = [
    ['hakkimizda', '/hakkimizda'],
    ['iletisim', '/iletisim'],
    ['kalite-belgelerimiz', '/kalite-belgelerimiz'],
    ['politikalarimiz', '/politikalarimiz'],
    ['kvkk', '/kvkk'],
    ['satis', '/satis'],
    ['is-basvurusu', '/is-basvurusu'],
  ];
  for (const [name, target] of slugMap) {
    out = out.replace(
      new RegExp(`(["'])(?:[^"']*\\/)?${name}\\.html`, 'g'),
      `$1${target}`,
    );
  }

  return out;
}

// ------------------------------------------------------------------
// Main
// ------------------------------------------------------------------
const pages = {};
const globalKeys = new Set();
const productDescriptions = {}; // { slug: { shortHtml, longHtml } }

for (const slug of PRODUCT_SLUGS) {
  const src = resolve(MIRROR_ROOT, slug, 'index.html');
  const raw = readFileSync(src, 'utf8');

  // 1) Description'lari cek (tr.json'a eklemek icin)
  const desc = extractDescriptions(raw);
  productDescriptions[slug] = desc;

  // 2) Ana DOM port
  const category = PRODUCT_TO_CATEGORY[slug];
  if (!category) throw new Error(`Missing category mapping for ${slug}`);
  const { html, keys } = processProductHtml(slug, raw);
  pages[slug] = { category, html };
  keys.forEach((k) => globalKeys.add(k));

  const tokens = html.match(/__T_[a-zA-Z0-9_.]+__/g) || [];
  const unique = new Set(tokens);
  console.log(
    `${slug.padEnd(44)} cat: ${category.padEnd(22)} size: ${(html.length / 1024).toFixed(1)} KB tokens: ${tokens.length} (${unique.size} unique)`,
  );
}

// ------------------------------------------------------------------
// TS module yaz
// ------------------------------------------------------------------
const tsBody =
  `// Auto-generated by scripts/build-product-html.mjs\n` +
  `// Kaynak: ../emaypanel-clone/emaypanel.com/ürün/<slug>/index.html\n` +
  `// Tekrar uretmek icin: node scripts/build-product-html.mjs\n` +
  `// Her export edilen HTML icinde __T_<namespace.key>__ token'lari\n` +
  `// runtime'da next-intl messages'tan cevrilir.\n\n` +
  `export const productPages: Record<string, { category: string; html: string }> = ${JSON.stringify(pages, null, 0)};\n`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, tsBody, 'utf8');

console.log(`\nWrote ${OUT}`);
console.log(`Total file size: ${(tsBody.length / 1024).toFixed(1)} KB`);
console.log(`Unique i18n keys across all products: ${globalKeys.size}`);

// ------------------------------------------------------------------
// Product descriptions'i ayri bir JSON olarak yaz (tr.json merge icin)
// ------------------------------------------------------------------
const descOut = resolve(PROJECT_ROOT, 'scripts/_product-descriptions.json');
writeFileSync(descOut, JSON.stringify(productDescriptions, null, 2), 'utf8');
console.log(`Wrote descriptions dump: ${descOut}`);

if (process.env.DEBUG) {
  [...globalKeys].sort().forEach((k) => console.log('  ', k));
}
