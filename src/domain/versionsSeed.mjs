// Актуализация версий в каталоге (10.10.2026, согласовано владельцем). Названия сверены с
// csoft.ru, ascon.ru, chaos.com, scadsoft.com. Адреса товаров не меняются: товары находятся
// по адресу (slug), правки — замена текста. Чистые функции без базы.

/**
 * @typedef {[string, string]} Pair
 * @typedef {{ slug: string, pairs: Pair[], summary?: string }} ProductFix
 * @typedef {{ slug: string, pairs: Pair[] }} OfferFix
 */

/**
 * Товары: пары «было → стало» применяются к названию, краткому описанию, описанию,
 * характеристикам и SEO. summary ставится, только если краткое описание пустое.
 * @type {ProductFix[]}
 */
export const PRODUCT_FIXES = [
  // Autodesk: год остался в заголовке для поисковиков и в описаниях.
  { slug: 'autodesk-revit', pairs: [['Revit 2024', 'Revit']] },
  { slug: 'recap_pro', pairs: [['ReCap Pro 2021', 'ReCap Pro']] },
  { slug: 'point_layout', pairs: [['Point Layout 2021', 'Point Layout']] },
  { slug: 'flame_assist', pairs: [['Autodesk Flame 2021', 'Autodesk Flame']] },
  {
    slug: 'kurs_autodesk_revit_arkhitekturnye_interery',
    pairs: [['Autodesk Revit 2019 или выше', 'Autodesk Revit 2024 или новее']],
  },
  // MagiCAD
  {
    slug: 'magicad_aksonometriya_dlya_revit',
    pairs: [
      ['Приложение поддерживается Revit MEP 2016 и новее', 'Работает в актуальных версиях Revit'],
    ],
  },
  // SCAD
  { slug: '720', pairs: [['SCAD Office v21', 'SCAD Office']] },
  // CSoft
  { slug: 'electrics_storm', pairs: [['ElectriCS Storm версии 2021', 'ElectriCS Storm 2025']] },
  {
    slug: 'model_studio_cs_stroitelnye_resheniya_v_1',
    pairs: [['новой платформы nanoCAD Plus 20.0 и AutoCAD 2020', 'платформ nanoCAD и AutoCAD']],
  },
  ...['spds_metallokonstruktsii', 'spds_stroyploshchadka', 'spds_zhelezobeton'].map((slug) => ({
    slug,
    pairs: /** @type {Pair[]} */ ([['СПДС GraphiCS 2021', 'СПДС GraphiCS 2026']]),
  })),
  // АСКОН: библиотеки называются как на ascon.ru, без версии КОМПАС.
  {
    slug: 'standartnye_izdeliya_krepezh_dlya_kompas_v18_litsenziya_vklyuchaet_krepezhnye_standartnye_i_prochie_',
    pairs: [
      [
        'Стандартные Изделия: Крепеж для КОМПАС v18, лицензия Включает крепежные стандартные и прочие изделия 2D и 3D по ГОСТ, ОСТ 92, ISO, DIN',
        'Стандартные Изделия: Крепеж 2D и 3D для КОМПАС-3D',
      ],
      ['КОМПАС v18', 'КОМПАС-3D'],
    ],
    summary: 'Крепежные стандартные и прочие изделия 2D и 3D по ГОСТ, ОСТ 92, ISO, DIN.',
  },
  {
    slug: 'standartnye_izdeliya_elektricheskie_apparaty_i_armatura_3d_dlya_kompas_v18_litsenziya',
    pairs: [
      [
        'Стандартные Изделия: Электрические аппараты и арматура 3D для КОМПАС v18, лицензия',
        'Стандартные Изделия: Электрические аппараты и арматура 3D для КОМПАС-3D',
      ],
      ['КОМПАС v18', 'КОМПАС-3D'],
    ],
  },
  {
    slug: 'standartnye_izdeliya_detali_uzly_i_konstruktivnye_elementy_dlya_kompas_v18_litsenziya_vklyuchaet_sta',
    pairs: [
      [
        'Стандартные Изделия: Детали, узлы и конструктивные элементы для КОМПАС v18, лицензия Включает стандартные и прочие изделия 2D и 3D: подшипники и детали машин, детали и арматуру трубопроводов, детали пневмо- и гидросистем, детали и узлы сосудов и аппаратов',
        'Стандартные Изделия: Детали, узлы и конструктивные элементы 2D и 3D для КОМПАС-3D',
      ],
      ['КОМПАС v18', 'КОМПАС-3D'],
    ],
    summary:
      'Стандартные и прочие изделия 2D и 3D: подшипники и детали машин, детали и арматура трубопроводов, детали пневмо- и гидросистем, детали и узлы сосудов и аппаратов.',
  },
  {
    slug: 'materialy_i_sortamenty_dlya_kompas_v18_litsenziya',
    pairs: [
      ['Материалы и Сортаменты для КОМПАС v18, лицензия', 'Материалы и Сортаменты для КОМПАС-3D'],
      ['КОМПАС v18', 'КОМПАС-3D'],
    ],
  },
]

/**
 * Предложения (комплектации) товара: пары применяются к названию и комплектации.
 * @type {OfferFix[]}
 */
export const OFFER_FIXES = [
  { slug: 'electrics_storm', pairs: [['2023.x', '2025.x']] },
  { slug: 'mechanics_oborudovanie', pairs: [['2023.x', '2025.x']] },
  {
    slug: 'geonics',
    pairs: [
      ['2025.x', '2027.x'],
      ['2026.x', '2027.x'],
    ],
  },
  ...[
    'spds_graphics',
    'spds_metallokonstruktsii',
    'spds_zhelezobeton',
    'spds_stroyploshchadka',
  ].map((slug) => ({ slug, pairs: /** @type {Pair[]} */ ([['2025.x', '2026.x']]) })),
  {
    slug: 'srd_2024_smetno_normativnaya_baza',
    pairs: [['СРД-2024 сметно нормативная база', 'СРД сметно-нормативная база']],
  },
]

/**
 * В черновики: старые версии V-Ray (3.0, Next, 5, MODO) и весь Phoenix — Chaos продаёт V-Ray 7
 * тарифами Solo/Premium/Collection, Phoenix выходит из поддержки; CS GisEngine нет на csoft.ru;
 * справочника подшипников нет на ascon.ru; ЛИРА-FEM «Академик сет 2025» убрать.
 */
export const DRAFT_RULES = [
  { vendor: 'Chaos Group', match: /V-Ray (?:3\.0|Next|5)\b|MODO|Phoenix/i },
  { vendor: 'Csoft Development', match: /CS GisEngine/i },
  { vendor: 'АСКОН', match: /Подшипники качения/i },
  { vendor: 'ЛИРА-FEM', match: /Академик сет 2025/i },
]

/** Семейства Chaos после снятия старых V-Ray и Phoenix. */
export const FAMILY_FIXES = {
  drafts: ['phoenix-fd'],
  intros: {
    'chaos-education':
      'Учебные лицензии V-Ray и VRScans для студентов, преподавателей и классов. Отметьте нужное — менеджер пришлёт коммерческое предложение.',
    'v-ray':
      'Визуализация V-Ray для Cinema 4D и Unreal, облачные кредиты для рендеринга и ключ защиты: аренда на месяц и год. Отметьте нужное — менеджер пришлёт коммерческое предложение.',
  },
}

/**
 * Применить пары к тексту по порядку. null и пустые значения возвращаются как есть.
 * @param {string | null | undefined} text
 * @param {Pair[]} pairs
 */
export function applyPairs(text, pairs) {
  if (!text) return text
  let out = text
  for (const [from, to] of pairs) out = out.split(from).join(to)
  return out
}

/**
 * Попадает ли товар под правило снятия в черновики.
 * @param {{ title: string, vendor: string }} product
 */
export function isDraftByVersion(product) {
  return DRAFT_RULES.some(
    (rule) => rule.vendor === product.vendor && rule.match.test(product.title),
  )
}
