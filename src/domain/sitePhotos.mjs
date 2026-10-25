// @ts-check
// Фото товаров файлами сайта (public/images/equipment), без загрузки в «Медиа»: хранилище
// Vercel Blob почти на лимите (решение 25.10.2026). Пачка WideTEK от владельца (ChatGPT,
// 26.10.2026): официальные рендеры Image Access, источники — manifest.csv пачки. У WideTEK 44 —
// рендеры WideTEK 48: корпус общий, 44 обновляется до 48 ключом.
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
}

/** @param {string} slug @returns {SitePhoto[]} */
export function sitePhotos(slug) {
  return Object.hasOwn(SITE_PHOTOS, slug) ? SITE_PHOTOS[slug] : []
}
