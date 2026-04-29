#!/usr/bin/env node
// build-product-html.mjs tarafindan uretilen scripts/_product-descriptions.json'dan
// ve sabit cevirilerden yararlanarak messages/{tr,en,ru,ar}.json dosyalarina
// eksik product / breadcrumb / catalog / category / header namespace'lerini merge et.
//
// Calistirma sirasi:
//   1. node scripts/build-product-html.mjs
//   2. node scripts/merge-product-messages.mjs
//
// Bu script mevcut key'leri KORUR - sadece eksik olanlari ekler.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const DESC_FILE = resolve(PROJECT_ROOT, 'scripts/_product-descriptions.json');
const MESSAGES_DIR = resolve(PROJECT_ROOT, 'messages');

const descriptions = JSON.parse(readFileSync(DESC_FILE, 'utf8'));

// ------------------------------------------------------------------
// Paylasilan global token'lar (breadcrumb, catalog, category, product labels)
// ------------------------------------------------------------------
// Bu key'ler hem kategori hem de urun sayfalari icin gerekli.
// Kategori build script'i kullaniyor ama messages'a eklenmemisti - burada ekliyoruz.
const sharedMessages = {
  tr: {
    breadcrumb: {
      home: 'Ana Sayfa',
      products: 'Ürünler',
    },
    catalog: {
      readMore: 'Devamını oku',
      showingAll: 'sonucun tümü gösteriliyor',
      showingRange: 'sonuç gösteriliyor',
      sort: {
        label: 'Sırala',
        default: 'Varsayılan Sıralama',
        popularity: 'En çok satılana göre sırala',
        rating: 'Ortalama puana göre sırala',
        newest: 'En yeniye göre sırala',
        priceAsc: 'Fiyata göre sırala: Düşükten yükseğe',
        priceDesc: 'Fiyata göre sırala: Yüksekten düşüğe',
      },
    },
    category: {
      cati: { title: 'Çatı Panelleri' },
      cephe: { title: 'Cephe Panelleri' },
      kombin: { title: 'Kombin Paneller' },
      sogukOda: { title: 'Soğuk Oda Panelleri' },
      ges: { title: 'GES Uygulama Çözümleri' },
      trapez: { title: 'Trapezler' },
      tamamlayici: { title: 'Tamamlayıcı Ürünler' },
    },
    product: {
      stockCodeLabel: 'Stok kodu:',
      categoriesLabel: 'Kategoriler:',
      descriptionTab: 'Açıklama',
      relatedHeading: 'İlgili ürünler',
    },
  },
  en: {
    breadcrumb: {
      home: 'Home',
      products: 'Products',
    },
    catalog: {
      readMore: 'Read more',
      showingAll: 'results shown',
      showingRange: 'results shown',
      sort: {
        label: 'Sort',
        default: 'Default sorting',
        popularity: 'Sort by popularity',
        rating: 'Sort by average rating',
        newest: 'Sort by latest',
        priceAsc: 'Sort by price: low to high',
        priceDesc: 'Sort by price: high to low',
      },
    },
    category: {
      cati: { title: 'Roof Panels' },
      cephe: { title: 'Facade Panels' },
      kombin: { title: 'Combined Panels' },
      sogukOda: { title: 'Cold Room Panels' },
      ges: { title: 'Solar (PV) Solutions' },
      trapez: { title: 'Trapezoidal Sheets' },
      tamamlayici: { title: 'Complementary Products' },
    },
    product: {
      stockCodeLabel: 'SKU:',
      categoriesLabel: 'Categories:',
      descriptionTab: 'Description',
      relatedHeading: 'Related products',
    },
  },
  ru: {
    breadcrumb: {
      home: 'Главная',
      products: 'Продукция',
    },
    catalog: {
      readMore: 'Подробнее',
      showingAll: 'результатов показано',
      showingRange: 'результатов показано',
      sort: {
        label: 'Сортировка',
        default: 'Сортировка по умолчанию',
        popularity: 'По популярности',
        rating: 'По средней оценке',
        newest: 'По новизне',
        priceAsc: 'По цене: по возрастанию',
        priceDesc: 'По цене: по убыванию',
      },
    },
    category: {
      cati: { title: 'Кровельные панели' },
      cephe: { title: 'Фасадные панели' },
      kombin: { title: 'Комбинированные панели' },
      sogukOda: { title: 'Панели для холодильных камер' },
      ges: { title: 'Решения для солнечных электростанций' },
      trapez: { title: 'Трапециевидные листы' },
      tamamlayici: { title: 'Дополнительные изделия' },
    },
    product: {
      stockCodeLabel: 'Артикул:',
      categoriesLabel: 'Категории:',
      descriptionTab: 'Описание',
      relatedHeading: 'Похожие товары',
    },
  },
  ar: {
    breadcrumb: {
      home: 'الرئيسية',
      products: 'المنتجات',
    },
    catalog: {
      readMore: 'اقرأ المزيد',
      showingAll: 'من النتائج معروضة',
      showingRange: 'من النتائج معروضة',
      sort: {
        label: 'ترتيب',
        default: 'الترتيب الافتراضي',
        popularity: 'الترتيب حسب الشعبية',
        rating: 'الترتيب حسب متوسط التقييم',
        newest: 'الترتيب حسب الأحدث',
        priceAsc: 'الترتيب حسب السعر: من الأقل إلى الأعلى',
        priceDesc: 'الترتيب حسب السعر: من الأعلى إلى الأقل',
      },
    },
    category: {
      cati: { title: 'ألواح السقف' },
      cephe: { title: 'ألواح الواجهة' },
      kombin: { title: 'الألواح المركبة' },
      sogukOda: { title: 'ألواح غرف التبريد' },
      ges: { title: 'حلول الطاقة الشمسية' },
      trapez: { title: 'الصفائح شبه المنحرفة' },
      tamamlayici: { title: 'منتجات مكملة' },
    },
    product: {
      stockCodeLabel: 'رمز المنتج:',
      categoriesLabel: 'الفئات:',
      descriptionTab: 'الوصف',
      relatedHeading: 'منتجات ذات صلة',
    },
  },
};

// ------------------------------------------------------------------
// Urun short/long description cevirileri.
// TR: dogrudan orijinal HTML.
// EN/RU/AR: terim sozlugu ile otomatik ceviri yapiyoruz (sektor terimleri,
// units, teknik etiketler). Marka adlari, RAL kodlari, sayisal degerler
// KORUNUR. Tablolar (teknik degerler) aynen korunur, sadece sutun basliklari
// ve prose paragraflari cevrilir.
// ------------------------------------------------------------------

// Sektor/teknik sozluk - case-sensitive, uzundan kisa replace yapilir.
// TR metnindeki token'lar ve karsiliklari.
const GLOSSARY = {
  en: [
    // Uzun/spesifik oncelikli
    ['Genel Özellikler', 'General Features'],
    ['Teknik Özellikler', 'Technical Specifications'],
    ['Yük Taşıma Tablosu', 'Load Capacity Table'],
    ['Yük Taşıma Kapasitesi Tablosu', 'Load Capacity Table'],
    ['Yalıtım Kalınlıkları', 'Insulation Thicknesses'],
    ['Yalıtım Kalınlığı', 'Insulation Thickness'],
    ['Yalıtım Yoğunluğu', 'Insulation Density'],
    ['Metal Kalınlıkları', 'Metal Thicknesses'],
    ['Isı İletkenlik Katsayısı', 'Thermal Conductivity Coefficient'],
    ['Yangın Sınıfı', 'Fire Class'],
    ['Su Absorbsiyonu', 'Water Absorption'],
    ['Buhar Difüzyon Direnci', 'Vapor Diffusion Resistance'],
    ['Kapalı Hücre Oranı', 'Closed Cell Ratio'],
    ['Boyutsal Kararlılık', 'Dimensional Stability'],
    ['Boya Tipleri', 'Coating Types'],
    ['Boyalı Galvaniz Sac', 'Painted Galvanized Steel'],
    ['Boyalı Alüminyum', 'Painted Aluminum'],
    ['Polivinilidin flourur', 'Polyvinylidene fluoride'],
    ['plastisol', 'plastisol'],
    ['polyester', 'polyester'],
    ['PVC film', 'PVC film'],
    ['pvc film', 'PVC film'],
    ['Dış Yüzey', 'Outer Surface'],
    ['İç Yüzey', 'Inner Surface'],
    ['Üst Sac', 'Top Sheet'],
    ['Alt Sac', 'Bottom Sheet'],
    ['ÜST SAC', 'TOP SHEET'],
    ['ALT SAC', 'BOTTOM SHEET'],
    ['YALITIM DOLGUSU', 'INSULATION FILLING'],
    ['YALITIM DOLGU KALINLIĞI', 'INSULATION FILLING THICKNESS'],
    ['ÇOKLU AÇIKLIK', 'MULTIPLE SPAN'],
    ['ÇİFT AÇIKLIK', 'DOUBLE SPAN'],
    ['TEK AÇIKLIK', 'SINGLE SPAN'],
    ['ISIL GEÇİRGENLİK U DEĞERİ', 'THERMAL TRANSMITTANCE U-VALUE'],
    ['ISIL DİRENÇ R DEĞERİ', 'THERMAL RESISTANCE R-VALUE'],
    ['ISIL DİRENÇ', 'THERMAL RESISTANCE'],
    ['sandviç panel', 'sandwich panel'],
    ['Sandviç panel', 'Sandwich panel'],
    ['Sandviç Panel', 'Sandwich Panel'],
    ['sandviç paneller', 'sandwich panels'],
    ['Çatı Paneli', 'Roof Panel'],
    ['çatı paneli', 'roof panel'],
    ['Çatı Panelleri', 'Roof Panels'],
    ['Cephe Paneli', 'Facade Panel'],
    ['cephe paneli', 'facade panel'],
    ['Cephe Panelleri', 'Facade Panels'],
    ['Kombin Paneller', 'Combined Panels'],
    ['Soğuk Oda Paneli', 'Cold Room Panel'],
    ['Soğuk Oda Panelleri', 'Cold Room Panels'],
    ['Taş Yünü Dolgulu Paneller', 'Mineral Wool Filled Panels'],
    ['Poliüretan ve Poliizosiyanürat Dolgulu Paneller', 'Polyurethane and Polyisocyanurate Filled Panels'],
    ['Poliüretan', 'Polyurethane'],
    ['poliüretan', 'polyurethane'],
    ['Poliizosiyanürat', 'Polyisocyanurate'],
    ['Taş Yünü', 'Mineral Wool'],
    ['taş yünü', 'mineral wool'],
    ['Yoğunluk', 'Density'],
    ['yoğunluk', 'density'],
    ['Kalınlık', 'Thickness'],
    ['kalınlık', 'thickness'],
    ['Kaplama', 'Coating'],
    ['kaplama', 'coating'],
    ['Uzunluk', 'Length'],
    ['uzunluk', 'length'],
    ['Genişlik', 'Width'],
    ['genişlik', 'width'],
    ['Yükseklik', 'Height'],
    ['yükseklik', 'height'],
    ['Uygulama Alanları', 'Applications'],
    ['uygulama alanları', 'applications'],
    ['Uygulama alanları', 'Applications'],
    ['Dayanıklılık', 'Durability'],
    ['dayanıklılık', 'durability'],
    ['Mukavemet', 'Strength'],
    ['mukavemet', 'strength'],
    ['Ekonomik', 'Economical'],
    ['ekonomik', 'economical'],
    ['Ekonomiktir', 'It is economical'],
    ['yalıtım', 'insulation'],
    ['Yalıtım', 'Insulation'],
    ['Kar yükü', 'Snow load'],
    ['kar yükü', 'snow load'],
    ['Rüzgar yükü', 'Wind load'],
    ['rüzgar yükü', 'wind load'],
    ['rüzgâr yükü', 'wind load'],
    ['montaj', 'installation'],
    ['Montaj', 'Installation'],
    ['ısı yalıtımı', 'thermal insulation'],
    ['Isı yalıtımı', 'Thermal insulation'],
    ['ses yalıtımı', 'acoustic insulation'],
    ['Ses Yalıtımı', 'Acoustic Insulation'],
    ['Ses yalıtımı', 'Acoustic insulation'],
    ['su emilimi', 'water absorption'],
    ['Su Emilimi', 'Water Absorption'],
    ['kapalı hücre yapısı', 'closed cell structure'],
    ['alev sürdürmez', 'flame retardant'],
    ['Alev sürdürmez', 'Flame retardant'],
    ['yangın dayanımlı', 'fire resistant'],
    ['yangın dayanımı', 'fire resistance'],
    ['Yangın Dayanımı', 'Fire Resistance'],
    ['paslanmaz çelik', 'stainless steel'],
    ['alüminyum', 'aluminum'],
    ['Alüminyum', 'Aluminum'],
    ['galvaniz sac', 'galvanized steel'],
    ['Galvaniz Sac', 'Galvanized Steel'],
    ['trapez', 'trapezoidal'],
    ['Trapez', 'Trapezoidal'],
    ['Trapezler', 'Trapezoidal Sheets'],
    ['hadve', 'corrugation'],
    ['Hadveli', 'Corrugated'],
    ['hadveli', 'corrugated'],
    ['boya seçenekleri', 'coating options'],
    ['Boya Seçenekleri', 'Coating Options'],
    ['Kesit Geometrisi', 'Cross-section Geometry'],
    ['kesit geometrisi', 'cross-section geometry'],
    ['taşıma performansı', 'load-bearing performance'],
    ['Sandviç Panel Fiyatları', 'Sandwich Panel Prices'],
    ['Daha detaylı bilgi için', 'For more detailed information, contact'],
    ['kalite birimine başvurunuz', 'quality department.'],
    ['paylaşılıştır', 'shared for reference'],
    ['Tablodaki taşıma yük değerleri', 'The load values in the table'],
    ['noktasal veya çizgisel yükleri içermemektedir', 'do not include point or linear loads'],
    ['düzgün yayılı yükü vermektedir', 'represent uniformly distributed load'],
    ['Saha koşullarına bağlı değişkenlerinde dikkate alınması önemlidir', 'Site-specific variables should be considered'],
    ['Tabloda verilen değerler yaklaşık hesaplar olup', 'Values in the table are approximate estimates'],
    ['fikir verek için', 'and are shared for reference'],
    ['paylaşılıştır', 'only'],
    ['Emay Panel tablodaki verileri değiştirme hakkını saklı tutar', 'Emay Panel reserves the right to modify the table data'],
    ['Malzeme DX-51 olarak kabul edilmiştir', 'Material is considered DX-51'],
    ['Sehim Limiti', 'Deflection Limit'],
    ['Emniyet gerilmesi yönetimine göre hesap yapılmıştır', 'Calculations are made according to allowable stress design'],
    ['Güçlü Çatılar İçin Üstün Performans', 'Superior Performance for Strong Roofs'],
    ['Güçlü Cephe İçin Üstün Performans', 'Superior Performance for Strong Facades'],
    ['Güçlü Cepheler İçin Üstün Performans', 'Superior Performance for Strong Facades'],
    ['Güçlü Kombin Sistem İçin Üstün Performans', 'Superior Performance for Strong Combined Systems'],
    ['Yüksek Performans', 'High Performance'],
    ['Üstün Performans', 'Superior Performance'],
    ['yüksek performans', 'high performance'],
    ['zorlu iklimlerde', 'in challenging climates'],
    ['yüksek kar ve rüzgâr yükü mukavemeti sağlar', 'provides high snow and wind load strength'],
    ['Dayanıklılık ve güvenliği ile', 'With its durability and safety'],
    ['Hadve yüksekliği ve kesit geometrisi sayesinde', 'Thanks to the corrugation height and cross-section geometry'],
    ['yüksek yük taşıma performansı sağlar', 'it provides high load-bearing performance'],
    ['Dıştan vidalı birleşim detayı ile montaj kolaylığı sunar', 'Offers installation convenience with external screwed joint detail'],
    ['PUR/PIR yalıtım dolgusu sayesinde yüksek ısı yalıtımı sağlar', 'Provides high thermal insulation thanks to PUR/PIR insulation filling'],
    ['kapalı hücre yapısı sayesinde su emilimi yapmaz', 'closed cell structure prevents water absorption'],
    ['PUR dolgusu ve yüksek yangın dayanımlı', 'PUR filling and high fire resistant'],
    ['yalıtım dolgusu seçenekleri ile üretilebilmektedir', 'insulation filling options are available'],
    ['optimum maliyetle maksimum verimlilik sunar', 'offers maximum efficiency at optimum cost'],
    ['Tasarımı sayesinde uzun ömürlü kullanım sağlar', 'Its design ensures long-lasting use'],
    ['yalıtım kalınlıklarında üretilebilmektedir', 'insulation thicknesses are available'],
    ['istediğiniz boylarda üretilebilmektedir', 'can be produced in desired lengths'],
    ['boylarda üretilebilmektedir', 'can be produced in lengths'],
    ['üretilebilmektedir', 'can be produced'],
    ['metaller ile üretilebilmektedir', 'metals are available'],
    ['Boyalı Galvaniz Sac (BGS)', 'Painted Galvanized Steel (PGS)'],
    ['Boyalı Alüminyum (BAL)', 'Painted Aluminum (PAL)'],
    ['paslanmaz çelik metaller', 'stainless steel metals'],
    ['sahiptir', 'features'],
    ['sunar', 'provides'],
    ['sağlar', 'provides'],
    ['yapmaz', 'prevents'],
    ['Ekonomiktir', 'Economical'],
    // Not: "ve", "ile" gibi 2-3 harfli bagilaclar kaldirildi -
    // cunku kelime ortasinda match ediyor (guandnlik, vs).
    // 5H/7F/8S markalari korunur (marka listesinde)
    ['Seviye DS', 'Level DS'],
    ['Hacimce', 'By volume'],
    ['saat', 'hours'],
  ],
  ru: [
    ['Genel Özellikler', 'Общие характеристики'],
    ['Teknik Özellikler', 'Технические характеристики'],
    ['Yük Taşıma Tablosu', 'Таблица несущей способности'],
    ['Yük Taşıma Kapasitesi Tablosu', 'Таблица несущей способности'],
    ['Yalıtım Kalınlıkları', 'Толщины изоляции'],
    ['Yalıtım Kalınlığı', 'Толщина изоляции'],
    ['Yalıtım Yoğunluğu', 'Плотность изоляции'],
    ['Metal Kalınlıkları', 'Толщины металла'],
    ['Isı İletkenlik Katsayısı', 'Коэффициент теплопроводности'],
    ['Yangın Sınıfı', 'Класс пожаробезопасности'],
    ['Su Absorbsiyonu', 'Водопоглощение'],
    ['Buhar Difüzyon Direnci', 'Сопротивление диффузии пара'],
    ['Kapalı Hücre Oranı', 'Доля закрытых ячеек'],
    ['Boyutsal Kararlılık', 'Размерная стабильность'],
    ['Boya Tipleri', 'Типы покрытия'],
    ['Boyalı Galvaniz Sac', 'Окрашенная оцинкованная сталь'],
    ['Boyalı Alüminyum', 'Окрашенный алюминий'],
    ['Dış Yüzey', 'Внешняя поверхность'],
    ['İç Yüzey', 'Внутренняя поверхность'],
    ['Üst Sac', 'Верхний лист'],
    ['Alt Sac', 'Нижний лист'],
    ['ÜST SAC', 'ВЕРХНИЙ ЛИСТ'],
    ['ALT SAC', 'НИЖНИЙ ЛИСТ'],
    ['YALITIM DOLGUSU', 'ИЗОЛЯЦИОННЫЙ НАПОЛНИТЕЛЬ'],
    ['YALITIM DOLGU KALINLIĞI', 'ТОЛЩИНА ИЗОЛЯЦИОННОГО НАПОЛНИТЕЛЯ'],
    ['ÇOKLU AÇIKLIK', 'МНОЖЕСТВЕННЫЙ ПРОЛЁТ'],
    ['ÇİFT AÇIKLIK', 'ДВОЙНОЙ ПРОЛЁТ'],
    ['TEK AÇIKLIK', 'ОДИНАРНЫЙ ПРОЛЁТ'],
    ['ISIL GEÇİRGENLİK U DEĞERİ', 'ТЕПЛОПРОВОДНОСТЬ U-ЗНАЧЕНИЕ'],
    ['ISIL DİRENÇ R DEĞERİ', 'ТЕПЛОВОЕ СОПРОТИВЛЕНИЕ R-ЗНАЧЕНИЕ'],
    ['ISIL DİRENÇ', 'ТЕПЛОВОЕ СОПРОТИВЛЕНИЕ'],
    ['sandviç panel', 'сэндвич-панель'],
    ['Sandviç panel', 'Сэндвич-панель'],
    ['Sandviç Panel', 'Сэндвич-панель'],
    ['sandviç paneller', 'сэндвич-панели'],
    ['Çatı Paneli', 'Кровельная панель'],
    ['çatı paneli', 'кровельная панель'],
    ['Çatı Panelleri', 'Кровельные панели'],
    ['Cephe Paneli', 'Фасадная панель'],
    ['cephe paneli', 'фасадная панель'],
    ['Cephe Panelleri', 'Фасадные панели'],
    ['Kombin Paneller', 'Комбинированные панели'],
    ['Soğuk Oda Paneli', 'Панель холодильной камеры'],
    ['Soğuk Oda Panelleri', 'Панели холодильных камер'],
    ['Taş Yünü Dolgulu Paneller', 'Панели с наполнителем из минеральной ваты'],
    ['Poliüretan ve Poliizosiyanürat Dolgulu Paneller', 'Панели с наполнителем из полиуретана и полиизоцианурата'],
    ['Poliüretan', 'Полиуретан'],
    ['poliüretan', 'полиуретан'],
    ['Poliizosiyanürat', 'Полиизоцианурат'],
    ['Taş Yünü', 'Минеральная вата'],
    ['taş yünü', 'минеральная вата'],
    ['Yoğunluk', 'Плотность'],
    ['yoğunluk', 'плотность'],
    ['Kalınlık', 'Толщина'],
    ['kalınlık', 'толщина'],
    ['Kaplama', 'Покрытие'],
    ['kaplama', 'покрытие'],
    ['Uzunluk', 'Длина'],
    ['uzunluk', 'длина'],
    ['Genişlik', 'Ширина'],
    ['genişlik', 'ширина'],
    ['Yükseklik', 'Высота'],
    ['yükseklik', 'высота'],
    ['Uygulama Alanları', 'Области применения'],
    ['Uygulama alanları', 'Области применения'],
    ['uygulama alanları', 'области применения'],
    ['Dayanıklılık', 'Долговечность'],
    ['dayanıklılık', 'долговечность'],
    ['Mukavemet', 'Прочность'],
    ['mukavemet', 'прочность'],
    ['Ekonomiktir', 'Экономично'],
    ['Ekonomik', 'Экономичный'],
    ['ekonomik', 'экономичный'],
    ['yalıtım', 'изоляция'],
    ['Yalıtım', 'Изоляция'],
    ['Kar yükü', 'Снеговая нагрузка'],
    ['kar yükü', 'снеговая нагрузка'],
    ['Rüzgar yükü', 'Ветровая нагрузка'],
    ['rüzgar yükü', 'ветровая нагрузка'],
    ['rüzgâr yükü', 'ветровая нагрузка'],
    ['montaj', 'монтаж'],
    ['Montaj', 'Монтаж'],
    ['ısı yalıtımı', 'теплоизоляция'],
    ['Isı yalıtımı', 'Теплоизоляция'],
    ['ses yalıtımı', 'акустическая изоляция'],
    ['Ses Yalıtımı', 'Акустическая изоляция'],
    ['Ses yalıtımı', 'Акустическая изоляция'],
    ['su emilimi', 'водопоглощение'],
    ['Su Emilimi', 'Водопоглощение'],
    ['kapalı hücre yapısı', 'структура закрытых ячеек'],
    ['alev sürdürmez', 'огнестойкий'],
    ['Alev sürdürmez', 'Огнестойкий'],
    ['yangın dayanımlı', 'огнеупорный'],
    ['yangın dayanımı', 'огнестойкость'],
    ['Yangın Dayanımı', 'Огнестойкость'],
    ['paslanmaz çelik', 'нержавеющая сталь'],
    ['alüminyum', 'алюминий'],
    ['Alüminyum', 'Алюминий'],
    ['galvaniz sac', 'оцинкованная сталь'],
    ['Galvaniz Sac', 'Оцинкованная сталь'],
    ['trapez', 'трапециевидный'],
    ['Trapez', 'Трапециевидный'],
    ['Trapezler', 'Трапециевидные листы'],
    ['hadve', 'гофр'],
    ['Hadveli', 'Гофрированный'],
    ['hadveli', 'гофрированный'],
    ['boya seçenekleri', 'варианты покрытия'],
    ['Boya Seçenekleri', 'Варианты покрытия'],
    ['Kesit Geometrisi', 'Геометрия сечения'],
    ['kesit geometrisi', 'геометрия сечения'],
    ['taşıma performansı', 'несущая способность'],
    ['Sandviç Panel Fiyatları', 'Цены на сэндвич-панели'],
    ['Daha detaylı bilgi için', 'Для получения более подробной информации обращайтесь в'],
    ['kalite birimine başvurunuz', 'отдел качества.'],
    ['Tablodaki taşıma yük değerleri', 'Значения несущей нагрузки в таблице'],
    ['noktasal veya çizgisel yükleri içermemektedir', 'не включают точечные или линейные нагрузки'],
    ['düzgün yayılı yükü vermektedir', 'представляют равномерно распределенную нагрузку'],
    ['Saha koşullarına bağlı değişkenlerinde dikkate alınması önemlidir', 'Важно учитывать переменные, связанные с условиями площадки'],
    ['Tabloda verilen değerler yaklaşık hesaplar olup', 'Значения в таблице являются приблизительными расчётами'],
    ['fikir verek için', 'и предоставляются для справки'],
    ['paylaşılıştır', 'только'],
    ['Emay Panel tablodaki verileri değiştirme hakkını saklı tutar', 'Emay Panel оставляет за собой право изменять данные таблицы'],
    ['Malzeme DX-51 olarak kabul edilmiştir', 'Материал принят как DX-51'],
    ['Sehim Limiti', 'Предел прогиба'],
    ['Emniyet gerilmesi yönetimine göre hesap yapılmıştır', 'Расчёты выполнены по методу допустимых напряжений'],
    ['Güçlü Çatılar İçin Üstün Performans', 'Превосходная производительность для прочных кровель'],
    ['Güçlü Cephe İçin Üstün Performans', 'Превосходная производительность для прочных фасадов'],
    ['Güçlü Cepheler İçin Üstün Performans', 'Превосходная производительность для прочных фасадов'],
    ['Güçlü Kombin Sistem İçin Üstün Performans', 'Превосходная производительность для прочных комбинированных систем'],
    ['Yüksek Performans', 'Высокая производительность'],
    ['Üstün Performans', 'Превосходная производительность'],
    ['yüksek performans', 'высокая производительность'],
    ['zorlu iklimlerde', 'в сложных климатических условиях'],
    ['yüksek kar ve rüzgâr yükü mukavemeti sağlar', 'обеспечивает высокую прочность при снеговых и ветровых нагрузках'],
    ['Dayanıklılık ve güvenliği ile', 'Благодаря своей прочности и безопасности'],
    ['Hadve yüksekliği ve kesit geometrisi sayesinde', 'Благодаря высоте гофра и геометрии сечения'],
    ['yüksek yük taşıma performansı sağlar', 'обеспечивает высокую несущую способность'],
    ['Dıştan vidalı birleşim detayı ile montaj kolaylığı sunar', 'Обеспечивает удобство монтажа благодаря внешнему винтовому соединению'],
    ['PUR/PIR yalıtım dolgusu sayesinde yüksek ısı yalıtımı sağlar', 'Благодаря наполнителю PUR/PIR обеспечивает высокую теплоизоляцию'],
    ['kapalı hücre yapısı sayesinde su emilimi yapmaz', 'структура закрытых ячеек предотвращает водопоглощение'],
    ['optimum maliyetle maksimum verimlilik sunar', 'обеспечивает максимальную эффективность при оптимальной стоимости'],
    ['Tasarımı sayesinde uzun ömürlü kullanım sağlar', 'Благодаря своей конструкции обеспечивает длительный срок службы'],
    ['yalıtım kalınlıklarında üretilebilmektedir', 'доступны толщины изоляции'],
    ['istediğiniz boylarda üretilebilmektedir', 'может быть изготовлен в нужных длинах'],
    ['boylarda üretilebilmektedir', 'может быть изготовлен в длинах'],
    ['üretilebilmektedir', 'доступно'],
    ['metaller ile üretilebilmektedir', 'варианты металлов'],
    ['Boyalı Galvaniz Sac (BGS)', 'Окрашенная оцинкованная сталь (BGS)'],
    ['Boyalı Alüminyum (BAL)', 'Окрашенный алюминий (BAL)'],
    ['paslanmaz çelik metaller', 'нержавеющая сталь'],
    ['sahiptir', 'имеет'],
    ['sunar', 'предлагает'],
    ['sağlar', 'обеспечивает'],
    ['yapmaz', 'не впитывает'],
    ['Seviye DS', 'Уровень DS'],
    ['Hacimce', 'По объёму'],
    ['saat', 'часов'],
  ],
  ar: [
    ['Genel Özellikler', 'الخصائص العامة'],
    ['Teknik Özellikler', 'المواصفات الفنية'],
    ['Yük Taşıma Tablosu', 'جدول قدرة التحميل'],
    ['Yük Taşıma Kapasitesi Tablosu', 'جدول قدرة التحميل'],
    ['Yalıtım Kalınlıkları', 'سماكات العزل'],
    ['Yalıtım Kalınlığı', 'سماكة العزل'],
    ['Yalıtım Yoğunluğu', 'كثافة العزل'],
    ['Metal Kalınlıkları', 'سماكات المعدن'],
    ['Isı İletkenlik Katsayısı', 'معامل التوصيل الحراري'],
    ['Yangın Sınıfı', 'فئة الحريق'],
    ['Su Absorbsiyonu', 'امتصاص الماء'],
    ['Buhar Difüzyon Direnci', 'مقاومة انتشار البخار'],
    ['Kapalı Hücre Oranı', 'نسبة الخلايا المغلقة'],
    ['Boyutsal Kararlılık', 'الاستقرار الأبعاد'],
    ['Boya Tipleri', 'أنواع الطلاء'],
    ['Boyalı Galvaniz Sac', 'فولاذ مجلفن مطلي'],
    ['Boyalı Alüminyum', 'ألومنيوم مطلي'],
    ['Dış Yüzey', 'السطح الخارجي'],
    ['İç Yüzey', 'السطح الداخلي'],
    ['Üst Sac', 'الصفيحة العلوية'],
    ['Alt Sac', 'الصفيحة السفلية'],
    ['ÜST SAC', 'الصفيحة العلوية'],
    ['ALT SAC', 'الصفيحة السفلية'],
    ['YALITIM DOLGUSU', 'حشو العزل'],
    ['YALITIM DOLGU KALINLIĞI', 'سماكة حشو العزل'],
    ['ÇOKLU AÇIKLIK', 'مسافات متعددة'],
    ['ÇİFT AÇIKLIK', 'مسافة مزدوجة'],
    ['TEK AÇIKLIK', 'مسافة واحدة'],
    ['ISIL GEÇİRGENLİK U DEĞERİ', 'قيمة الانتقال الحراري U'],
    ['ISIL DİRENÇ R DEĞERİ', 'قيمة المقاومة الحرارية R'],
    ['ISIL DİRENÇ', 'المقاومة الحرارية'],
    ['sandviç panel', 'لوح ساندويتش'],
    ['Sandviç panel', 'لوح ساندويتش'],
    ['Sandviç Panel', 'لوح الساندويتش'],
    ['sandviç paneller', 'ألواح ساندويتش'],
    ['Çatı Paneli', 'لوح السقف'],
    ['çatı paneli', 'لوح السقف'],
    ['Çatı Panelleri', 'ألواح السقف'],
    ['Cephe Paneli', 'لوح الواجهة'],
    ['cephe paneli', 'لوح الواجهة'],
    ['Cephe Panelleri', 'ألواح الواجهة'],
    ['Kombin Paneller', 'الألواح المركبة'],
    ['Soğuk Oda Paneli', 'لوح غرفة التبريد'],
    ['Soğuk Oda Panelleri', 'ألواح غرف التبريد'],
    ['Taş Yünü Dolgulu Paneller', 'ألواح محشوة بالصوف الصخري'],
    ['Poliüretan ve Poliizosiyanürat Dolgulu Paneller', 'ألواح محشوة بالبولي يوريثان والبولي إيزوسيانورات'],
    ['Poliüretan', 'بولي يوريثان'],
    ['poliüretan', 'بولي يوريثان'],
    ['Poliizosiyanürat', 'بولي إيزوسيانورات'],
    ['Taş Yünü', 'الصوف الصخري'],
    ['taş yünü', 'الصوف الصخري'],
    ['Yoğunluk', 'الكثافة'],
    ['yoğunluk', 'الكثافة'],
    ['Kalınlık', 'السماكة'],
    ['kalınlık', 'السماكة'],
    ['Kaplama', 'الطلاء'],
    ['kaplama', 'الطلاء'],
    ['Uzunluk', 'الطول'],
    ['uzunluk', 'الطول'],
    ['Genişlik', 'العرض'],
    ['genişlik', 'العرض'],
    ['Yükseklik', 'الارتفاع'],
    ['yükseklik', 'الارتفاع'],
    ['Uygulama Alanları', 'مجالات التطبيق'],
    ['Uygulama alanları', 'مجالات التطبيق'],
    ['uygulama alanları', 'مجالات التطبيق'],
    ['Dayanıklılık', 'المتانة'],
    ['dayanıklılık', 'المتانة'],
    ['Mukavemet', 'القوة'],
    ['mukavemet', 'القوة'],
    ['Ekonomiktir', 'اقتصادي'],
    ['Ekonomik', 'اقتصادي'],
    ['ekonomik', 'اقتصادي'],
    ['yalıtım', 'العزل'],
    ['Yalıtım', 'العزل'],
    ['Kar yükü', 'حمل الثلج'],
    ['kar yükü', 'حمل الثلج'],
    ['Rüzgar yükü', 'حمل الرياح'],
    ['rüzgar yükü', 'حمل الرياح'],
    ['rüzgâr yükü', 'حمل الرياح'],
    ['montaj', 'التركيب'],
    ['Montaj', 'التركيب'],
    ['ısı yalıtımı', 'العزل الحراري'],
    ['Isı yalıtımı', 'العزل الحراري'],
    ['ses yalıtımı', 'العزل الصوتي'],
    ['Ses Yalıtımı', 'العزل الصوتي'],
    ['Ses yalıtımı', 'العزل الصوتي'],
    ['su emilimi', 'امتصاص الماء'],
    ['Su Emilimi', 'امتصاص الماء'],
    ['kapalı hücre yapısı', 'هيكل الخلايا المغلقة'],
    ['alev sürdürmez', 'مقاوم للهب'],
    ['Alev sürdürmez', 'مقاوم للهب'],
    ['yangın dayanımlı', 'مقاوم للحريق'],
    ['yangın dayanımı', 'مقاومة الحريق'],
    ['Yangın Dayanımı', 'مقاومة الحريق'],
    ['paslanmaz çelik', 'الفولاذ المقاوم للصدأ'],
    ['alüminyum', 'الألومنيوم'],
    ['Alüminyum', 'الألومنيوم'],
    ['galvaniz sac', 'الفولاذ المجلفن'],
    ['Galvaniz Sac', 'الفولاذ المجلفن'],
    ['trapez', 'شبه منحرف'],
    ['Trapez', 'شبه منحرف'],
    ['Trapezler', 'الصفائح شبه المنحرفة'],
    ['hadve', 'التضليع'],
    ['Hadveli', 'مضلع'],
    ['hadveli', 'مضلع'],
    ['boya seçenekleri', 'خيارات الطلاء'],
    ['Boya Seçenekleri', 'خيارات الطلاء'],
    ['Kesit Geometrisi', 'هندسة المقطع'],
    ['kesit geometrisi', 'هندسة المقطع'],
    ['taşıma performansı', 'أداء التحميل'],
    ['Sandviç Panel Fiyatları', 'أسعار ألواح الساندويتش'],
    ['Daha detaylı bilgi için', 'لمزيد من المعلومات التفصيلية، اتصلوا بـ'],
    ['kalite birimine başvurunuz', 'قسم الجودة.'],
    ['Tablodaki taşıma yük değerleri', 'قيم التحميل في الجدول'],
    ['noktasal veya çizgisel yükleri içermemektedir', 'لا تشمل الأحمال النقطية أو الخطية'],
    ['düzgün yayılı yükü vermektedir', 'تمثل الحمل الموزع بانتظام'],
    ['Saha koşullarına bağlı değişkenlerinde dikkate alınması önemlidir', 'من المهم مراعاة المتغيرات المتعلقة بظروف الموقع'],
    ['Tabloda verilen değerler yaklaşık hesaplar olup', 'القيم في الجدول هي تقديرات تقريبية'],
    ['fikir verek için', 'وتُشارك للمرجع'],
    ['paylaşılıştır', 'فقط'],
    ['Emay Panel tablodaki verileri değiştirme hakkını saklı tutar', 'تحتفظ Emay Panel بالحق في تعديل بيانات الجدول'],
    ['Malzeme DX-51 olarak kabul edilmiştir', 'المادة تعتبر DX-51'],
    ['Sehim Limiti', 'حد الانحراف'],
    ['Emniyet gerilmesi yönetimine göre hesap yapılmıştır', 'تم إجراء الحسابات وفقًا لطريقة الإجهادات المسموح بها'],
    ['Güçlü Çatılar İçin Üstün Performans', 'أداء ممتاز لأسقف قوية'],
    ['Güçlü Cephe İçin Üstün Performans', 'أداء ممتاز للواجهات القوية'],
    ['Güçlü Cepheler İçin Üstün Performans', 'أداء ممتاز للواجهات القوية'],
    ['Güçlü Kombin Sistem İçin Üstün Performans', 'أداء ممتاز للأنظمة المركبة القوية'],
    ['Yüksek Performans', 'أداء عالٍ'],
    ['Üstün Performans', 'أداء ممتاز'],
    ['yüksek performans', 'أداء عالٍ'],
    ['zorlu iklimlerde', 'في المناخات الصعبة'],
    ['yüksek kar ve rüzgâr yükü mukavemeti sağlar', 'يوفر مقاومة عالية لأحمال الثلوج والرياح'],
    ['Dayanıklılık ve güvenliği ile', 'بفضل متانته وأمانه'],
    ['Hadve yüksekliği ve kesit geometrisi sayesinde', 'بفضل ارتفاع التضليع وهندسة المقطع'],
    ['yüksek yük taşıma performansı sağlar', 'يوفر أداء تحميل عاليًا'],
    ['Dıştan vidalı birleşim detayı ile montaj kolaylığı sunar', 'يوفر سهولة التركيب بفضل تفاصيل الوصلة المُثبَّتة بالبراغي من الخارج'],
    ['PUR/PIR yalıtım dolgusu sayesinde yüksek ısı yalıtımı sağlar', 'يوفر عزلًا حراريًا عاليًا بفضل حشو PUR/PIR'],
    ['kapalı hücre yapısı sayesinde su emilimi yapmaz', 'يمنع هيكل الخلايا المغلقة امتصاص الماء'],
    ['optimum maliyetle maksimum verimlilik sunar', 'يوفر أقصى كفاءة بأمثل تكلفة'],
    ['Tasarımı sayesinde uzun ömürlü kullanım sağlar', 'يضمن تصميمه استخدامًا طويل الأمد'],
    ['yalıtım kalınlıklarında üretilebilmektedir', 'سماكات العزل المتاحة'],
    ['istediğiniz boylarda üretilebilmektedir', 'يمكن إنتاجه بالأطوال المطلوبة'],
    ['boylarda üretilebilmektedir', 'يمكن إنتاجه بأطوال'],
    ['üretilebilmektedir', 'متاح'],
    ['metaller ile üretilebilmektedir', 'خيارات المعادن'],
    ['Boyalı Galvaniz Sac (BGS)', 'الفولاذ المجلفن المطلي (BGS)'],
    ['Boyalı Alüminyum (BAL)', 'الألومنيوم المطلي (BAL)'],
    ['paslanmaz çelik metaller', 'الفولاذ المقاوم للصدأ'],
    ['sahiptir', 'يتميز'],
    ['sunar', 'يوفر'],
    ['sağlar', 'يوفر'],
    ['yapmaz', 'يمنع'],
    ['Seviye DS', 'المستوى DS'],
    ['Hacimce', 'بالحجم'],
    ['saat', 'ساعة'],
  ],
};

function translateHtml(html, locale) {
  if (!html) return '';
  if (locale === 'tr') return html;
  let out = html;
  const dict = GLOSSARY[locale] || [];
  // Uzun terimler once (onceden siralanmis)
  for (const [src, tgt] of dict) {
    // Escape regex special chars, global replace
    const escaped = src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(escaped, 'g'), tgt);
  }
  return out;
}

// ------------------------------------------------------------------
// Merge helpers
// ------------------------------------------------------------------
function setIfMissing(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur[p] == null || typeof cur[p] !== 'object') {
      cur[p] = {};
    }
    cur = cur[p];
  }
  const last = parts[parts.length - 1];
  if (cur[last] === undefined) {
    cur[last] = value;
  }
}

function deepMerge(target, source) {
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if (!target[k] || typeof target[k] !== 'object') target[k] = {};
      deepMerge(target[k], v);
    } else if (target[k] === undefined) {
      target[k] = v;
    }
  }
}

// ------------------------------------------------------------------
// Main
// ------------------------------------------------------------------
const locales = ['tr', 'en', 'ru', 'ar'];
const addedCounts = {};

for (const locale of locales) {
  const file = resolve(MESSAGES_DIR, `${locale}.json`);
  const data = JSON.parse(readFileSync(file, 'utf8'));

  // Baseline ek namespace'leri merge et (mevcut olani koru)
  deepMerge(data, sharedMessages[locale]);

  // Urun short/long description'lari: HER SEFERINDE TEKRAR URET
  // (glossary guncellenebilir, o yuzden mevcut product desc'leri sifirliyoruz
  //  ama global product namespace altindaki stockCodeLabel/... KORUNUR).
  if (!data.product) data.product = {};
  // Sadece slug anahtarlarini temizle (label'lari koru)
  for (const k of Object.keys(data.product)) {
    if (k.includes('-') || k === 'trapez-saclar' || k.startsWith('emay-') || k === 'c-profil') {
      delete data.product[k];
    }
  }
  let added = 0;
  for (const [slug, { shortHtml, longHtml }] of Object.entries(descriptions)) {
    if (!data.product[slug]) data.product[slug] = {};
    if (shortHtml) {
      data.product[slug].shortDesc = translateHtml(shortHtml, locale);
      added++;
    }
    if (longHtml) {
      data.product[slug].longDesc = translateHtml(longHtml, locale);
      added++;
    }
  }

  // Yaz
  writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');

  // Say
  function count(o) {
    let n = 0;
    if (o && typeof o === 'object') {
      for (const v of Object.values(o)) n += count(v);
    } else if (typeof o === 'string') {
      n++;
    }
    return n;
  }
  addedCounts[locale] = { total: count(data), added };
  console.log(`${locale}: total=${addedCounts[locale].total}, product desc added this run=${added}`);
}

console.log('\nMerge complete.');
