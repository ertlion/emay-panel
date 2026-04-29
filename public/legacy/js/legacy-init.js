/*
 * Legacy WordPress + Elementor + ElementsKit global config
 * Bu dosya orijinal emaypanel.com sayfasinin inline <script> taglarinde
 * tanimlanan global degiskenleri yeniden-urutir. Elementor/KeyDesign
 * JS'lerinin calisabilmesi icin bunlar var olmali.
 *
 * strategy="beforeInteractive" ile jquery'den sonra ilk sirada yuklenmeli.
 */
(function () {
  'use strict';

  // ElementsKit REST URL (gercek endpoint tikamis olabilir, zararsiz)
  window.elementskit = window.elementskit || {
    resturl: '/wp-json/elementskit/v1/',
  };

  // ElementsKit parallax modul URL
  window.elementskit_module_parallax_url = '/legacy/';

  // WPML cookie dummy
  window.wpml_cookies = {
    'wp-wpml_current_language': { value: 'tr', expires: 1, path: '/' },
  };

  // ElementsKit ekit_config (ajax fail olabilir, zararsiz)
  window.ekit_config = {
    ajaxurl: '/api/legacy-ajax',
    nonce: 'legacy',
  };

  // Elementor frontend config - orijinalden kopyalandi, static.
  window.elementorFrontendConfig = {
    environmentMode: { edit: false, wpPreview: false, isScriptDebug: false },
    i18n: {
      shareOnFacebook: 'Facebook’ta paylaş',
      shareOnTwitter: 'Twitter’da paylaşın',
      pinIt: 'Sabitle',
      download: 'İndir',
      downloadImage: 'Görseli indir',
      fullscreen: 'Tam Ekran',
      zoom: 'Yakınlaştır',
      share: 'Paylaş',
      playVideo: 'Videoyu Oynat',
      previous: 'Önceki',
      next: 'Sonraki',
      close: 'Kapat',
      a11yCarouselPrevSlideMessage: 'Önceki Slayt',
      a11yCarouselNextSlideMessage: 'Sonraki Slayt',
      a11yCarouselFirstSlideMessage: 'Bu ilk slayt',
      a11yCarouselLastSlideMessage: 'Bu son slayt',
      a11yCarouselPaginationBulletMessage: 'Slayta Git',
    },
    is_rtl: false,
    breakpoints: { xs: 0, sm: 480, md: 768, lg: 1025, xl: 1440, xxl: 1600 },
    responsive: {
      breakpoints: {
        mobile: {
          label: 'Mobil Portre',
          value: 767,
          default_value: 767,
          direction: 'max',
          is_enabled: true,
        },
        mobile_extra: {
          label: 'Mobil Görünümü',
          value: 880,
          default_value: 880,
          direction: 'max',
          is_enabled: false,
        },
        tablet: {
          label: 'Tablet Portresi',
          value: 1024,
          default_value: 1024,
          direction: 'max',
          is_enabled: true,
        },
        tablet_extra: {
          label: 'Tablet Görünümü',
          value: 1200,
          default_value: 1200,
          direction: 'max',
          is_enabled: false,
        },
        laptop: {
          label: 'Dizüstü bilgisayar',
          value: 1366,
          default_value: 1366,
          direction: 'max',
          is_enabled: false,
        },
        widescreen: {
          label: 'Geniş ekran',
          value: 2400,
          default_value: 2400,
          direction: 'min',
          is_enabled: false,
        },
      },
      hasCustomBreakpoints: false,
    },
    version: '3.35.7',
    is_static: false,
    experimentalFeatures: {
      additional_custom_breakpoints: true,
      container: true,
      e_optimized_markup: true,
      'nested-elements': true,
    },
    urls: {
      assets: '/legacy/',
      ajaxurl: '/api/legacy-ajax',
      uploadUrl: '/uploads',
    },
    nonces: { floatingButtonsClickTracking: 'legacy' },
    swiperClass: 'swiper',
    settings: { page: [], editorPreferences: [] },
    kit: {
      active_breakpoints: ['viewport_mobile', 'viewport_tablet'],
      global_image_lightbox: 'yes',
      lightbox_enable_counter: 'yes',
      lightbox_enable_fullscreen: 'yes',
      lightbox_enable_zoom: 'yes',
      lightbox_enable_share: 'yes',
      lightbox_title_src: 'title',
      lightbox_description_src: 'description',
    },
    post: { id: 26811, title: 'Emay Panel', excerpt: '', featuredImage: false },
  };
})();
