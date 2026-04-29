#!/usr/bin/env node
// Mirror'in <head> ve body sonu <script>'lerini (inline + src) sirayla yakalayip
// src/lib/legacy-inline-scripts.ts olarak uretir.
// Mirror src URL'lerini bizim public/legacy/js/<filename> mapping'ine cevirir.
// SIRA KRITIK: mirror'in body sonu sirasi inline + src interleaved.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const SOURCE_HTML = resolve(
  PROJECT_ROOT,
  '../emaypanel-clone/emaypanel.com/ürün/emay-smart-3h-dv/index.html',
);
const OUT = resolve(PROJECT_ROOT, 'src/lib/legacy-inline-scripts.ts');

// Mirror'daki <script src="..."> filename'leri -> public/legacy/js/<bizim-dosyamiz>
const SRC_MAP = {
  'jquery.min.js': '/legacy/js/jquery.min.js',
  'jquery-migrate.min.js': '/legacy/js/jquery-migrate.min.js',
  'core.min.js': '/legacy/js/jquery-ui-core.min.js',
  'view.min.js': '/legacy/js/wp-image-view.min.js',
  'widget-scripts.js': '/legacy/js/widget-scripts.js',
  'hooks.min.js': '/legacy/js/hooks.min.js',
  'i18n.min.js': '/legacy/js/i18n.min.js',
  'front-end.js': '/legacy/js/karbon-front-end.js',
  'sourcebuster.min.js': '/legacy/js/sourcebuster.min.js',
  'order-attribution.min.js': '/legacy/js/order-attribution.min.js',
  'keydesign-framework.js': '/legacy/js/keydesign-framework.js',
  'webpack.runtime.min.js': '/legacy/js/webpack.runtime.min.js',
  'frontend-modules.min.js': '/legacy/js/frontend-modules.min.js',
  'frontend.min.js': '/legacy/js/frontend.min.js',
  'elementor.js': '/legacy/js/elementor.js',
  'swiper.min.js': '/legacy/js/swiper.min.js',
  'jarallax.js': '/legacy/js/jarallax.js',
  'odometer.min.js': '/legacy/js/odometer.min.js',
  'elementskit-sticky-content.js': '/legacy/js/elementskit-sticky-content.js',
  'back-to-top.js': '/legacy/js/back-to-top.js',
  'legacy-init.js': '/legacy/js/legacy-init.js',
  // WooCommerce galeri init
  'single-product.min.js': '/legacy/js/wc-single-product.min.js',
  'jquery.flexslider.min.js': '/legacy/js/jquery.flexslider.min.js',
  'jquery.zoom.min.js': '/legacy/js/jquery.zoom.min.js',
  'photoswipe.min.js': '/legacy/js/photoswipe.min.js',
  'photoswipe-ui-default.min.js': '/legacy/js/photoswipe-ui-default.min.js',
  'add-to-cart.min.js': '/legacy/js/wc-add-to-cart.min.js',
  'woocommerce.min.js': '/legacy/js/woocommerce.min.js',
  'jquery.blockUI.min.js': '/legacy/js/jquery.blockUI.min.js',
  'js.cookie.min.js': '/legacy/js/js.cookie.min.js',
  'language-cookie.js': '/legacy/js/wpml-language-cookie.js',
  // Contact Form 7 - script'in iki tane index.js@ver=6.1.5 var, sirayla map
  // Mirror sirasi: ilki includes/js/, ikincisi includes/swv/js/
  // Bizim mapping'imiz path-bazli olmali ama path/dosya adi yetersiz - inline sira ile yapilacak.
  // Bunlar icin ozel handler asagida.
  'elementor.js@ver=4.1.2': '/legacy/js/elementskit-elementor-pro.js',
};

// Path icindeki anahtar pattern'lere gore ek mapping
function resolveSrc(srcUrl) {
  const cleanPath = srcUrl.split('?')[0];
  const filename = cleanPath.split('/').pop();
  const filenameNoVer = filename.split('@')[0];

  // Contact Form 7 path-disambiguation
  if (cleanPath.includes('contact-form-7/includes/swv/js/index.js')) {
    return '/legacy/js/wpcf7-swv-index.js';
  }
  if (cleanPath.includes('contact-form-7/includes/js/index.js')) {
    return '/legacy/js/wpcf7-index.js';
  }
  // ElementsKit pro elementor.js (4.1.2)
  if (cleanPath.includes('plugins/elementskit/widgets/init/assets/js/elementor.js')) {
    return '/legacy/js/elementskit-elementor-pro.js';
  }
  // ElementsKit Lite elementor.js (3.8.1)
  if (cleanPath.includes('plugins/elementskit-lite/widgets/init/assets/js/elementor.js')) {
    return '/legacy/js/elementor.js';
  }

  return SRC_MAP[filenameNoVer] || SRC_MAP[filename] || null;
}

const src = readFileSync(SOURCE_HTML, 'utf8');
const headEnd = src.toLowerCase().indexOf('</head>');
const bodyEnd = src.toLowerCase().lastIndexOf('</body>');

const headBlock = src.slice(0, headEnd);
const bodyBlock = src.slice(headEnd, bodyEnd);

// Helper - <script> tag'lerini sirayla cek
function extractScripts(html) {
  const scripts = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1] || '';
    const body = m[2].trim();
    const srcM = attrs.match(/src=['"]([^'"]+)['"]/);
    const typeM = attrs.match(/type=['"]([^'"]+)['"]/);
    scripts.push({
      src: srcM ? srcM[1] : null,
      inline: body,
      type: typeM ? typeM[1] : null,
    });
  }
  return scripts;
}

const headScripts = extractScripts(headBlock);
const bodyScripts = extractScripts(bodyBlock);

const out = [];

// 1) Head icindeki TUM script'ler (inline + src) mirror sirasiyla.
// jQuery, jquery-migrate vb. burada yuklenir; sonraki body inline'lar bunlara baglidir.
for (const s of headScripts) {
  if (s.src) {
    const local = resolveSrc(s.src);
    if (!local) {
      console.log(`  [head] skipped (no mapping): ${s.src}`);
      continue;
    }
    const typeAttr = s.type === 'module' ? ' type="module"' : '';
    out.push(`<script src="${local}"${typeAttr}></script>`);
  } else if (s.inline) {
    let typeAttr = '';
    if (s.type === 'module') typeAttr = ' type="module"';
    else if (s.type === 'application/ld+json') typeAttr = ' type="application/ld+json"';
    else if (s.type === 'application/json') typeAttr = ' type="application/json"';
    else if (s.type === 'speculationrules') typeAttr = ' type="speculationrules"';
    out.push(`<script${typeAttr}>${s.inline}</script>`);
  }
}

// 2) Body sonu scripts mirror sirasiyla (inline + src interleaved)
for (const s of bodyScripts) {
  if (s.src) {
    const local = resolveSrc(s.src);
    if (!local) {
      // bilinmeyen src - skip ama uyari ver
      console.log(`  skipped (no mapping): ${s.src}`);
      continue;
    }
    const typeAttr = s.type === 'module' ? ' type="module"' : '';
    out.push(`<script src="${local}"${typeAttr}></script>`);
  } else if (s.inline) {
    // inline body - 'application/ld+json' ve module'leri korur, gerisi default text/javascript
    let typeAttr = '';
    if (s.type === 'module') typeAttr = ' type="module"';
    else if (s.type === 'application/ld+json') typeAttr = ' type="application/ld+json"';
    else if (s.type === 'application/json') typeAttr = ' type="application/json"';
    else if (s.type === 'speculationrules') typeAttr = ' type="speculationrules"';
    out.push(`<script${typeAttr}>${s.inline}</script>`);
  }
}

let combined = out.join('\n');

// URL normalize
combined = combined.replace(/https?:\/\/(?:www\.)?emaypanel\.com\/wp-content\/uploads\//g, '/uploads/');
combined = combined.replace(/\/\/(?:www\.)?emaypanel\.com\/wp-content\/uploads\//g, '/uploads/');
combined = combined.replace(/https?:\/\/(?:www\.)?emaypanel\.com\//g, '/');
combined = combined.replace(/\/\/(?:www\.)?emaypanel\.com\//g, '/');

// PATCH 1: lazyloadRunObserver - readyState fallback + setTimeout reveal-all
combined = combined.replace(
  /events\.forEach\( \( event \) => \{\s*document\.addEventListener\( event, lazyloadRunObserver \);\s*\} \);/,
  `events.forEach((event) => document.addEventListener(event, lazyloadRunObserver));
\t\t\t\tif (document.readyState !== 'loading') { lazyloadRunObserver(); }
\t\t\t\t/* Next.js streaming + IntersectionObserver bazen bos array donduruyor;
\t\t\t\t * 500ms sonra hala revealed olmamis e-con'lari elle reveal et. */
\t\t\t\tsetTimeout(() => {
\t\t\t\t\tdocument.querySelectorAll('.e-con.e-parent:not(.e-lazyloaded)').forEach((el) => el.classList.add('e-lazyloaded'));
\t\t\t\t}, 500);`,
);

// PATCH 2: woocommerce-no-js -> woocommerce-js swap (React hydration override icin retry)
combined = combined.replace(
  /\(function \(\) \{[\s\S]*?c\.replace\(\/woocommerce-no-js\/, 'woocommerce-js'\)[\s\S]*?\}\)\(\);/,
  `(function applyWooJsClass() {
\t\t\tvar apply = function () {
\t\t\t\tvar b = document.body;
\t\t\t\tif (!b) return;
\t\t\t\tif (b.className.indexOf('woocommerce-no-js') !== -1) {
\t\t\t\t\tb.className = b.className.replace(/woocommerce-no-js/, 'woocommerce-js');
\t\t\t\t}
\t\t\t};
\t\t\tapply();
\t\t\tsetTimeout(apply, 0);
\t\t\tsetTimeout(apply, 100);
\t\t})();`,
);

const ts =
  `// Auto-generated by scripts/build-legacy-scripts.mjs\n` +
  `// Kaynak: emaypanel-clone/emaypanel.com/urun/emay-smart-3h-dv/index.html\n` +
  `// Mirror'in body sonu <script>'lerini birebir sirayla. SIRA KRITIK.\n` +
  `// Tekrar uretmek icin: node scripts/build-legacy-scripts.mjs\n\n` +
  `export const LEGACY_INLINE_SCRIPTS = String.raw\`${combined.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\`;\n`;

writeFileSync(OUT, ts, 'utf8');

console.log(`\nWrote ${OUT}: ${(ts.length / 1024).toFixed(1)} KB`);
console.log(`Total scripts: ${out.length}`);
console.log(`Head inlines: ${headScripts.filter(s => s.inline && !s.src).length}`);
console.log(`Body scripts (src + inline): ${bodyScripts.length}`);
