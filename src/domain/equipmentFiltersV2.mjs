// @ts-check
// Фильтры плоттеров и широкоформатных сканеров по образцу владельца (23.10.2026, скриншоты
// фильтров маркетплейса): «Максимальный формат печати», «Технология печати», «Разрешение»,
// «Скорость», «Цвет печати», у сканеров — формат, разрешение, скорость, цветность в битах.
// Значения ровные, без россыпи «28 сек на A1» / «26 сек на A1»: у нас 10 плоттеров и 11 сканеров.
// Источник цифр — характеристики из исследования (src/domain/equipmentResearch.json).
// Группы и порядок значений — src/domain/equipmentFacets.json, в базу пишет
// src/lib/equipmentFiltersSetup.ts разово при сборке.

/** Старые группы, которые заменены новыми и стираются из товара. */
export const REMOVED_KEYS = {
  plotters: ['width', 'scanner'],
  'wide-scanners': ['width', 'resolution'],
}

const A0 = 'A0 (36″, 914 мм)'
const A0_PLUS = 'A0+ (42–44″)'
const INKJET = 'Струйная пигментная'
const SOLID = 'Твердочернильная CrystalPoint'
const LED = 'Светодиодная (LED) тонерная'
const COLOR = 'Цветная'
const MONO = 'Монохромная'
const SPEED_4 = '3–4 листа A1 в минуту'
const SPEED_6 = '6 листов A1 в минуту'
const SPEED_10 = '8–10 листов A1 в минуту'

/** @type {Record<string, Record<string, string | string[]>>} */
const PLOTTERS = {
  imageprograf_tz_32000: {
    format: A0,
    technology: INKJET,
    color: COLOR,
    resolution: '2400 × 1200',
    speed: SPEED_4,
  },
  imageprograf_tz_30000: {
    format: A0,
    technology: INKJET,
    color: COLOR,
    resolution: '2400 × 1200',
    speed: SPEED_4,
  },
  imageprograf_tx_4200: {
    format: A0_PLUS,
    technology: INKJET,
    color: COLOR,
    resolution: '2400 × 1200',
    speed: SPEED_4,
  },
  imageprograf_tx_4100: {
    format: A0_PLUS,
    technology: INKJET,
    color: COLOR,
    resolution: '2400 × 1200',
    speed: SPEED_4,
  },
  imageprograf_tx_3200: {
    format: A0,
    technology: INKJET,
    color: COLOR,
    resolution: '2400 × 1200',
    speed: SPEED_4,
  },
  // До 225 листов D (≈ A1) в час — около 3,7 в минуту.
  canon_colorwave_t65: {
    format: A0_PLUS,
    technology: SOLID,
    color: COLOR,
    resolution: '600 × 600',
    speed: SPEED_4,
  },
  canon_colorwave_t60: {
    format: A0_PLUS,
    technology: SOLID,
    color: COLOR,
    resolution: '600 × 600',
    speed: SPEED_4,
  },
  // Скорость в исследовании — листов A0 в минуту; один A0 = два A1.
  plotwave_t75: {
    format: A0,
    technology: LED,
    color: MONO,
    resolution: '600 × 1200',
    speed: SPEED_10,
  },
  plotwave_t50_t55: {
    format: A0,
    technology: LED,
    color: MONO,
    resolution: '600 × 1200',
    speed: SPEED_10,
  },
  plotwave_t30_35: {
    format: A0,
    technology: LED,
    color: MONO,
    resolution: '600 × 1200',
    speed: [SPEED_4, SPEED_6],
  },
  plotwave_7500: {
    format: A0,
    technology: LED,
    color: MONO,
    resolution: '600 × 1200',
    speed: SPEED_10,
  },
}

const S_A3 = 'A3'
const S_A2 = 'A2'
const S_A0 = 'A0 (36″)'
const S_A0_PLUS = 'A0+ (44–48″)'
const S_60 = 'до 1,5 м (60″)'
const SPEED_8_IN = 'до 8 дюймов в секунду'
const SPEED_10_IN = 'до 10 дюймов в секунду'
const SPEED_15_IN = 'до 15 дюймов в секунду'
const FLATBED = 'Кадр за 3–4 секунды'
const BIT_48 = '48 бит'
const BIT_36 = '36 бит'

/** @type {Record<string, Record<string, string | string[]>>} */
const SCANNERS = {
  shirokoformatnyy_skaner_widetek_60cl_s_shirinoy_60_1524_mm_podstavkoy_21_touch_bsw_scanwizard_fc_war:
    { format: S_60, resolution: '1200 × 1200', speed: SPEED_8_IN, depth: BIT_48 },
  widetek_48_shirokoformatnyy_skaner_48_1220_mm_so_vstroennym_pk_scanwizard_bez_napolnoy_stoyki: {
    format: S_A0_PLUS,
    resolution: '1200 × 600',
    speed: SPEED_15_IN,
    depth: BIT_36,
  },
  widetek_48cl_shirokoformatnyy_skaner_48_1220_mm_so_vstroennym_pk_scanwizard_bez_napolnoy_stoyki: {
    format: S_A0_PLUS,
    resolution: '1200 × 1200',
    speed: SPEED_10_IN,
    depth: BIT_48,
  },
  widetek_44_shirokoformatnyy_skaner_44_1118_mm_v_komplekte_podstavka_22_touch_bsw_scanwizard_fc_warra:
    { format: S_A0_PLUS, resolution: '1200 × 600', speed: SPEED_15_IN, depth: BIT_36 },
  // Бесконтактный сканер для картин: скорость в мм/с, в общую шкалу не попадает.
  widetek_36art_fine_art_scanner_36_vstroennyy_pk_15_touch_motorizovannyy_transportirovochnyy_stol:
    { format: S_A0, resolution: '600 × 600', depth: BIT_48 },
  shirokoformatnyy_skaner_widetek_36_s_shirinoy_36_915_mm_v_komplekte_podstavka_22_touch_bsw_scanwizar:
    { format: S_A0, resolution: '1200 × 600', speed: SPEED_15_IN, depth: BIT_36 },
  shirokoformatnyy_skaner_widetek_36cl_s_shirinoy_36_915_mm_so_vstroennym_pk_scanwizard_bez_napolnoy_s:
    { format: S_A0, resolution: '1200 × 1200', speed: SPEED_10_IN, depth: BIT_48 },
  widetek_36cl_skaner_dlya_canon_tx_3_4000_ipf_pro_tx_komplekt_krepleniya_pro_21_touch_printwizard_lfp:
    { format: S_A0, resolution: '1200 × 1200', speed: SPEED_10_IN, depth: BIT_48 },
  planshetnyy_skaner_widetek_25: {
    format: S_A2,
    resolution: '1200 × 600',
    speed: FLATBED,
    depth: BIT_36,
  },
  widetek_24f_dina2_ploskiy_skaner_cis_24_x_18_610_x_457_mm_so_vstroennym_pk: {
    format: S_A2,
    resolution: '1200 × 600',
    speed: FLATBED,
    depth: BIT_48,
  },
  planshetnyy_skaner_widetek_12_s_shirinoy_12_3_x_18_5_v_komplekte_vklyuchaya_nozhnoy_pereklyuchatel_b:
    { format: S_A3, resolution: '1200 × 600', speed: FLATBED, depth: BIT_36 },
}

/** Новые значения фильтров по slug товара и его категории исследования. */
export const EQUIPMENT_FILTERS_V2 = { plotters: PLOTTERS, 'wide-scanners': SCANNERS }

/**
 * Фильтры товара после замены: старые группы без убранных ключей плюс новые значения.
 * @param {string} category
 * @param {Record<string, unknown> | null | undefined} current
 * @param {Record<string, string | string[]>} next
 */
export function mergeFilters(category, current, next) {
  const removed = REMOVED_KEYS[/** @type {keyof typeof REMOVED_KEYS} */ (category)] ?? []
  /** @type {Record<string, unknown>} */
  const result = {}
  for (const [key, value] of Object.entries(current ?? {}))
    if (!removed.includes(key) && !(key in next)) result[key] = value
  return { ...result, ...next }
}
