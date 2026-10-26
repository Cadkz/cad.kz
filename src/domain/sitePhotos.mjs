// @ts-check
// Фото товаров файлами сайта (public/images/equipment), без загрузки в «Медиа»: хранилище
// Vercel Blob почти на лимите (решение 25.10.2026). Пачка WideTEK от владельца (ChatGPT,
// 26.10.2026): официальные рендеры Image Access, источники — manifest.csv пачки. У WideTEK 44 —
// рендеры WideTEK 48: корпус общий, 44 обновляется до 48 ключом.
// Пачка Artec (ChatGPT, 26.10.2026): официальные фото и рендеры artec3d.com, источники —
// manifest.csv пачки; у Eva убран почти повтор первого кадра, у Leo — обрезок экрана. Скриншоты
// Artec Studio и Artec Cloud — в public/images/software; карточка программы остаётся с логотипом.
// Порядок: первая — главная (вырезанная, для карточки и сцены), остальные — галерея.
// «Картинка для карточки» и галерея из админки показываются раньше и вместе с этими фото.

/** @typedef {{ url: string, width: number, height: number }} SitePhoto */

/** slug товара → фото. @type {Record<string, SitePhoto[]>} */
export const SITE_PHOTOS = {
  // widetek-60cl
  shirokoformatnyy_skaner_widetek_60cl_s_shirinoy_60_1524_mm_podstavkoy_21_touch_bsw_scanwizard_fc_war:
    [
      { url: '/images/equipment/widetek-60cl-1.webp', width: 1600, height: 1229 },
      { url: '/images/equipment/widetek-60cl-2.webp', width: 1600, height: 1229 },
      { url: '/images/equipment/widetek-60cl-3.webp', width: 904, height: 1600 },
    ],
  // widetek-48cl
  widetek_48cl_shirokoformatnyy_skaner_48_1220_mm_so_vstroennym_pk_scanwizard_bez_napolnoy_stoyki: [
    { url: '/images/equipment/widetek-48cl-1.webp', width: 1600, height: 1393 },
    { url: '/images/equipment/widetek-48cl-2.webp', width: 1600, height: 1393 },
    { url: '/images/equipment/widetek-48cl-3.webp', width: 932, height: 1600 },
  ],
  // widetek-48
  widetek_48_shirokoformatnyy_skaner_48_1220_mm_so_vstroennym_pk_scanwizard_bez_napolnoy_stoyki: [
    { url: '/images/equipment/widetek-48-1.webp', width: 1600, height: 1414 },
    { url: '/images/equipment/widetek-48-2.webp', width: 1600, height: 1414 },
    { url: '/images/equipment/widetek-48-3.webp', width: 939, height: 1600 },
  ],
  // widetek-44
  widetek_44_shirokoformatnyy_skaner_44_1118_mm_v_komplekte_podstavka_22_touch_bsw_scanwizard_fc_warra:
    [
      { url: '/images/equipment/widetek-48-1.webp', width: 1600, height: 1414 },
      { url: '/images/equipment/widetek-48-2.webp', width: 1600, height: 1414 },
      { url: '/images/equipment/widetek-48-3.webp', width: 939, height: 1600 },
    ],
  // widetek-36art
  widetek_36art_fine_art_scanner_36_vstroennyy_pk_15_touch_motorizovannyy_transportirovochnyy_stol:
    [
      { url: '/images/equipment/widetek-36art-1.webp', width: 1600, height: 1026 },
      { url: '/images/equipment/widetek-36art-2.webp', width: 1600, height: 1026 },
      { url: '/images/equipment/widetek-36art-3.webp', width: 1195, height: 1600 },
    ],
  // widetek-36cl
  shirokoformatnyy_skaner_widetek_36cl_s_shirinoy_36_915_mm_so_vstroennym_pk_scanwizard_bez_napolnoy_s:
    [
      { url: '/images/equipment/widetek-36cl-1.webp', width: 1541, height: 1600 },
      { url: '/images/equipment/widetek-36cl-2.webp', width: 1541, height: 1600 },
      { url: '/images/equipment/widetek-36cl-3.webp', width: 944, height: 1600 },
    ],
  // widetek-36cl-canon-tx
  widetek_36cl_skaner_dlya_canon_tx_3_4000_ipf_pro_tx_komplekt_krepleniya_pro_21_touch_printwizard_lfp:
    [
      { url: '/images/equipment/widetek-36cl-canon-tx-1.webp', width: 1333, height: 1600 },
      { url: '/images/equipment/widetek-36cl-canon-tx-2.webp', width: 1600, height: 900 },
      { url: '/images/equipment/widetek-36cl-canon-tx-3.webp', width: 1600, height: 900 },
    ],
  // widetek-36
  shirokoformatnyy_skaner_widetek_36_s_shirinoy_36_915_mm_v_komplekte_podstavka_22_touch_bsw_scanwizar:
    [
      { url: '/images/equipment/widetek-36-1.webp', width: 1510, height: 1600 },
      { url: '/images/equipment/widetek-36-2.webp', width: 1510, height: 1600 },
      { url: '/images/equipment/widetek-36-3.webp', width: 967, height: 1600 },
    ],
  // widetek-25
  planshetnyy_skaner_widetek_25: [
    { url: '/images/equipment/widetek-25-1.webp', width: 1600, height: 974 },
    { url: '/images/equipment/widetek-25-2.webp', width: 1600, height: 1514 },
    { url: '/images/equipment/widetek-25-3.webp', width: 1570, height: 1600 },
  ],
  // widetek-24f
  widetek_24f_dina2_ploskiy_skaner_cis_24_x_18_610_x_457_mm_so_vstroennym_pk: [
    { url: '/images/equipment/widetek-24f-1.webp', width: 1600, height: 958 },
    { url: '/images/equipment/widetek-24f-2.webp', width: 1600, height: 1542 },
    { url: '/images/equipment/widetek-24f-3.webp', width: 1600, height: 1427 },
  ],
  // widetek-12
  planshetnyy_skaner_widetek_12_s_shirinoy_12_3_x_18_5_v_komplekte_vklyuchaya_nozhnoy_pereklyuchatel_b:
    [
      { url: '/images/equipment/widetek-12-1.webp', width: 1212, height: 1600 },
      { url: '/images/equipment/widetek-12-2.webp', width: 869, height: 1600 },
      { url: '/images/equipment/widetek-12-3.webp', width: 1596, height: 1600 },
    ],
  // artec-leo
  artec_leo: [
    { url: '/images/equipment/artec-leo-1.webp', width: 1600, height: 1485 },
    { url: '/images/equipment/artec-leo-2.webp', width: 1600, height: 1067 },
    { url: '/images/equipment/artec-leo-3.webp', width: 1340, height: 1340 },
  ],
  // artec-eva
  artec_eva: [
    { url: '/images/equipment/artec-eva-1.webp', width: 915, height: 1600 },
    { url: '/images/equipment/artec-eva-3.webp', width: 1288, height: 1289 },
    { url: '/images/equipment/artec-eva-4.webp', width: 1288, height: 1289 },
  ],
  // artec-spider-ii
  artec_spider_ii: [
    { url: '/images/equipment/artec-spider-ii-1.webp', width: 959, height: 1167 },
    { url: '/images/equipment/artec-spider-ii-2.webp', width: 1600, height: 1068 },
    { url: '/images/equipment/artec-spider-ii-3.webp', width: 712, height: 849 },
  ],
  // artec-micro-ii
  artec_micro_ii: [
    { url: '/images/equipment/artec-micro-ii-1.webp', width: 1600, height: 1402 },
    { url: '/images/equipment/artec-micro-ii-2.webp', width: 1600, height: 1600 },
    { url: '/images/equipment/artec-micro-ii-3.webp', width: 1600, height: 1600 },
    { url: '/images/equipment/artec-micro-ii-4.webp', width: 1600, height: 1600 },
  ],
  // artec-ray-ii
  artec_ray_ii: [
    { url: '/images/equipment/artec-ray-ii-1.webp', width: 1554, height: 1600 },
    { url: '/images/equipment/artec-ray-ii-2.webp', width: 1600, height: 998 },
    { url: '/images/equipment/artec-ray-ii-3.webp', width: 1600, height: 1600 },
  ],
  // artec-jet
  artec_jet: [
    { url: '/images/equipment/artec-jet-1.webp', width: 1083, height: 1024 },
    { url: '/images/equipment/artec-jet-2.webp', width: 1600, height: 901 },
    { url: '/images/equipment/artec-jet-3.webp', width: 1600, height: 686 },
  ],
  // artec-point-ii
  artec_point_ii: [
    { url: '/images/equipment/artec-point-ii-1.webp', width: 418, height: 1012 },
    { url: '/images/equipment/artec-point-ii-2.webp', width: 448, height: 1005 },
    { url: '/images/equipment/artec-point-ii-3.webp', width: 287, height: 1006 },
  ],
  // artec-neo
  artec_neo: [
    { url: '/images/equipment/artec-neo-1.webp', width: 882, height: 1074 },
    { url: '/images/equipment/artec-neo-2.webp', width: 1600, height: 1001 },
    { url: '/images/equipment/artec-neo-3.webp', width: 757, height: 889 },
    { url: '/images/equipment/artec-neo-4.webp', width: 997, height: 970 },
  ],
  // artec-studio
  artec_studio_19: [
    { url: '/images/software/artec-studio-1.webp', width: 1600, height: 900 },
    { url: '/images/software/artec-studio-2.webp', width: 1030, height: 754 },
  ],
  // artec-cloud
  artec_cloud: [
    { url: '/images/software/artec-cloud-1.webp', width: 1600, height: 900 },
    { url: '/images/software/artec-cloud-2.webp', width: 1600, height: 900 },
    { url: '/images/software/artec-cloud-3.webp', width: 1288, height: 1289 },
  ],
}

/** @param {string} slug @returns {SitePhoto[]} */
export function sitePhotos(slug) {
  return Object.hasOwn(SITE_PHOTOS, slug) ? SITE_PHOTOS[slug] : []
}
