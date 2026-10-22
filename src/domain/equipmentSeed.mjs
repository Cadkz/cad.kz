// @ts-check
// Оборудование как в Битриксе (замечания владельца 22.10.2026, раздел HANDOFF «Следующий шаг»,
// пункты 1–4): четыре типа плитками, плоттеры и комплектующие внутри «Широкоформатных
// плоттеров», в 3D-сканерах только сканеры Artec, Image Access → WideTEK, флагманы первыми.

/** Новое название производителя (адреса и связи прежние, старое — для поиска). */
export const VENDOR_RENAME = { from: 'Image Access', to: 'WideTEK' }

/**
 * Разделы оборудования. Описания короткие: на плитке типа в ряд из четырёх видно три строки.
 * parent: null — верхний тип, строка — подраздел. Порядок у верхних —
 * среди всех разделов (после «3D-сканеров» 110), у подразделов — внутри родителя.
 * @type {{ slug: string, title: string, parent: string | null, order: number,
 *   summary: string, icon?: 'scan' | 'printer' | 'monitor', pins?: string[] }[]}
 */
export const EQUIPMENT_SECTIONS = [
  {
    slug: 'scanners',
    title: '3D-сканеры',
    parent: null,
    order: 110,
    summary: 'Ручные и стационарные сканеры Artec.',
    pins: ['Artec 3D'],
  },
  {
    slug: 'wide-format',
    title: 'Широкоформатные плоттеры',
    parent: null,
    order: 120,
    summary: 'Плоттеры и МФУ Canon, картриджи и тонеры.',
    icon: 'printer',
    pins: ['Canon'],
  },
  {
    slug: 'wide-scanners',
    title: 'Широкоформатные сканеры',
    parent: null,
    order: 125,
    summary: 'Сканеры WideTEK для чертежей и карт.',
    icon: 'scan',
    pins: ['WideTEK'],
  },
  {
    slug: 'workstations',
    title: 'Рабочие станции',
    parent: null,
    order: 130,
    summary: 'Графические станции Iridium для BIM и расчётов.',
  },
  {
    slug: 'plotters',
    title: 'Плоттеры',
    parent: 'wide-format',
    order: 10,
    summary: 'Canon imagePROGRAF, plotWAVE и colorWAVE.',
  },
  {
    slug: 'consumables',
    title: 'Комплектующие',
    parent: 'wide-format',
    order: 20,
    summary: 'Картриджи и тонеры для плоттеров Canon.',
  },
]

/** Раздел программ для сканов (ПО, а не оборудование): Artec Studio, Artec Cloud, ReCap Pro. */
export const SCAN_SOFTWARE_SECTION = 'machine'

/**
 * Программы, которые стояли в «3D-сканировании». kind — новый тип товара (Artec Studio и Cloud
 * в Битриксе были оборудованием), extra — дополнительные разделы (null — оставить свои без
 * 3D-сканеров). Внутри подбора сканеров они остаются допами.
 * @type {{ slug: string, kind: 'software', extra: string[] | null }[]}
 */
export const SCAN_SOFTWARE = [
  { slug: 'artec_studio_19', kind: 'software', extra: [] },
  { slug: 'artec_cloud', kind: 'software', extra: [] },
  { slug: 'recap_pro', kind: 'software', extra: null },
]

/** Метрологический набор — только доп в подборе сканеров, своя карточка не нужна. */
export const ADDON_ONLY = [{ slug: 'metrologicheskiy_nabor_artec', redirect: 'artec_eva' }]

/**
 * Порядок в линейке — флагманы первыми (цен нет, все «по запросу»), предложение владельцу:
 * у Canon сначала производственные системы PlotWave и цветные colorWAVE, затем plotWAVE,
 * затем струйные imagePROGRAF от старших к младшим; у WideTEK — от самых широких и точных
 * (CCD) к простым, планшетные в конце. Меняется в админке: товар → «Порядок в линейке».
 */
export const FLAGSHIP_ORDER = [
  'plotwave_7500',
  'canon_colorwave_t65',
  'canon_colorwave_t60',
  'plotwave_t75',
  'plotwave_t50_t55',
  'plotwave_t30_35',
  'imageprograf_tz_32000',
  'imageprograf_tz_30000',
  'imageprograf_tx_4200',
  'imageprograf_tx_4100',
  'imageprograf_tx_3200',
  'shirokoformatnyy_skaner_widetek_60cl_s_shirinoy_60_1524_mm_podstavkoy_21_touch_bsw_scanwizard_fc_war',
  'widetek_48_shirokoformatnyy_skaner_48_1220_mm_so_vstroennym_pk_scanwizard_bez_napolnoy_stoyki',
  'widetek_48cl_shirokoformatnyy_skaner_48_1220_mm_so_vstroennym_pk_scanwizard_bez_napolnoy_stoyki',
  'widetek_44_shirokoformatnyy_skaner_44_1118_mm_v_komplekte_podstavka_22_touch_bsw_scanwizard_fc_warra',
  'shirokoformatnyy_skaner_widetek_36_s_shirinoy_36_915_mm_v_komplekte_podstavka_22_touch_bsw_scanwizar',
  'shirokoformatnyy_skaner_widetek_36cl_s_shirinoy_36_915_mm_so_vstroennym_pk_scanwizard_bez_napolnoy_s',
  'widetek_36cl_skaner_dlya_canon_tx_3_4000_ipf_pro_tx_komplekt_krepleniya_pro_21_touch_printwizard_lfp',
  'widetek_36art_fine_art_scanner_36_vstroennyy_pk_15_touch_motorizovannyy_transportirovochnyy_stol',
  'planshetnyy_skaner_widetek_25',
  'widetek_24f_dina2_ploskiy_skaner_cis_24_x_18_610_x_457_mm_so_vstroennym_pk',
  'planshetnyy_skaner_widetek_12_s_shirinoy_12_3_x_18_5_v_komplekte_vklyuchaya_nozhnoy_pereklyuchatel_b',
]

/**
 * Номер «Порядка в линейке» по позиции в FLAGSHIP_ORDER: с шагом 10, чтобы владелец мог
 * вставить модель между соседями, не перенумеровывая остальные.
 * @param {string} slug
 * @returns {number | null}
 */
export function flagshipOrder(slug) {
  const index = FLAGSHIP_ORDER.indexOf(slug)
  return index === -1 ? null : (index + 1) * 10
}

/**
 * Правила разделов для новых товаров из импорта: программы Artec — в «Машиностроение», ReCap
 * тоже (раньше «3D-сканирование»). Ставятся перед общим правилом Artec.
 */
export const EQUIPMENT_RULES = [
  {
    title: 'Artec Studio и Artec Cloud — Машиностроение',
    vendor: 'Artec 3D',
    words: 'studio, cloud',
    main: 'machine',
    extra: [],
  },
]

/** Правило ReCap: основной раздел меняется с «3D-сканирования» на «Машиностроение». */
export const RECAP_RULE_WORDS = 'recap'
