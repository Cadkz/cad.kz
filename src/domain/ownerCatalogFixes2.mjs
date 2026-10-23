// @ts-check
// Решения владельца 23.10.2026, вторая часть (src/lib/ownerCatalogFixes2.ts).
// Чистые данные без базы.

/**
 * Программы, у которых владелец вернул прежние описания: тексты исследования ему не понравились
 * («щас стремно»). Вместе с KEEP_OWN_TEXT это все программы из исследования.
 */
export const RESTORE_TEXT_V2 = [
  'architecture_engineering_construction_collection-1107088405',
  'autodesk-revit',
  'recap_pro',
  'autocad_revit_lt_suite',
  'lira_sapr',
  'geo5',
  'the_software_package_avs_4',
  'artec_studio_19',
  'artec_cloud',
]

/** Исправления названий: только ошибки, без версий и брендов из исследования. */
export const RENAMES_V2 = {
  // В названии жёлтого тонера стоял артикул чёрного.
  toner_canon_6692c003aa_colorwave_t60_toner_y_6692c004aa:
    'Тонер Canon/6692C003AA/colorWAVE T60 Toner Y',
  plotwave_t30_35: 'plotWAVE T30/T35',
}

const NEW_GENERATION =
  'Новое поколение Canon imagePROGRAF TX, объявлено 15.09.2026. Поставки в Казахстан и страны региона EMEA — с ноября 2026 года.'

/**
 * @param {{ width: string, mm: string, predecessor: string, mfp: string }} model
 * @returns {{ name: string, value: string }[]}
 */
function txSpecs(model) {
  return [
    { name: 'Печать — Максимальная ширина носителя', value: `${model.width} (${model.mm})` },
    { name: 'Печать — Чернила', value: '5 пигментных цветов: MBK, BK, C, M, Y' },
    { name: 'Печать — Разрешение', value: '2400 × 1200 dpi' },
    {
      name: 'Производительность — Чертёж A1 на обычной бумаге',
      value: 'около 17 с (3,3 листа в минуту)',
    },
    { name: 'Материалы — Рулоны', value: 'Два рулона с автоматическим переключением' },
    { name: 'Управление — Экран', value: 'Сенсорный, 4,3 дюйма' },
    { name: 'Хранение — Встроенный диск', value: 'SSD 256 ГБ с шифрованием' },
    {
      name: 'Подключение — Интерфейсы',
      value: 'Gigabit Ethernet, Wi-Fi, USB-B, USB-A для печати с флешки',
    },
    { name: 'Безопасность', value: 'Печать по PIN-коду, шифрование соединений, стирание диска' },
    { name: 'МФУ', value: `Вариант ${model.mfp} со сканером Z36` },
    { name: 'Предыдущая модель', value: model.predecessor },
  ]
}

/** @param {{ title: string, width: string, mm: string, predecessor: string, mfp: string }} model */
function txDescription(model) {
  return [
    `${model.title} — широкоформатный плоттер для чертежей, планов и схем формата ${model.width === '36"' ? 'A0' : 'A0+'} в проектных и строительных организациях. ${NEW_GENERATION}`,
    `Приходит на смену ${model.predecessor}: новые чернила matte black для более чётких тонких линий, второй рулон в стандартной комплектации, автоматическая калибровка и выдвижная приёмная корзина.`,
    '## Что умеет',
    [
      '- Чертёж A1 примерно за 17 секунд в экономичном режиме',
      '- Два рулона с автопереключением: обычная бумага и калька без перезаправки',
      '- Замена чернильных баков на ходу, без остановки печати',
      '- Печать с флешки, по сети и по Wi-Fi',
    ].join('\n'),
    '## Для кого',
    'Проектные бюро и отделы, где каждый день печатают комплекты чертежей A1–A0, а также печать планов и простых плакатов. Для сканирования и копирования есть вариант МФУ со сканером Z36.',
  ].join('\n\n')
}

const TX_FILTERS = {
  technology: 'Струйная пигментная',
  color: 'Цветная',
  resolution: '2400 × 1200',
  speed: '3–4 листа A1 в минуту',
  rolls: '2',
}

/**
 * Новые модели: в регионе TX-3200 и TX-4200 ещё продаются, новые приходят с ноября 2026 —
 * обе линейки в каталоге, цена по запросу. Остальные поля (производитель, линейка, разделы,
 * фото) копируются у предыдущей модели той же серии.
 */
export const NEW_PLOTTERS = [
  {
    slug: 'imageprograf_tx_3300',
    copyFrom: 'imageprograf_tx_3200',
    title: 'imagePROGRAF TX-3300',
    summary:
      'Плоттер 36" (A0) нового поколения: 5 пигментных цветов, два рулона, A1 за 17 секунд. Поставки с ноября 2026.',
    model: { width: '36"', mm: '914 мм', predecessor: 'imagePROGRAF TX-3200', mfp: 'TX-3310' },
    filters: { ...TX_FILTERS, format: 'A0 (36″, 914 мм)' },
  },
  {
    slug: 'imageprograf_tx_4300',
    copyFrom: 'imageprograf_tx_4200',
    title: 'imagePROGRAF TX-4300',
    summary:
      'Плоттер 44" (A0+) нового поколения: 5 пигментных цветов, два рулона, A1 за 17 секунд. Поставки с ноября 2026.',
    model: { width: '44"', mm: '1118 мм', predecessor: 'imagePROGRAF TX-4200', mfp: 'TX-4310' },
    filters: { ...TX_FILTERS, format: 'A0+ (42–44″)' },
  },
].map(({ model, ...entry }) => ({
  ...entry,
  description: txDescription({ ...model, title: entry.title }),
  properties: txSpecs(model),
  knowledge: `${entry.title}. ${NEW_GENERATION} Замена для ${model.predecessor}, который ещё есть в продаже. Ширина ${model.width}, 5 пигментных цветов, два рулона, A1 около 17 с, Wi-Fi и Ethernet, вариант МФУ ${model.mfp}. Цена и срок поставки — у менеджера.`,
}))
