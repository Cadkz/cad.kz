/**
 * Навигация по производителям в новостях, статьях и акциях (решение владельца 13.10.2026).
 * У публикаций нет поля «производитель», поэтому узнаём его по словам в заголовке, анонсе
 * и тексте: так работает и для всех перенесённых со старого сайта новостей сразу.
 * Порядок — порядок кнопок над списком.
 */
export const NEWS_VENDORS = [
  {
    slug: 'autodesk',
    title: 'Autodesk',
    words: [
      'autodesk',
      'autocad',
      'revit',
      'civil 3d',
      'navisworks',
      'inventor',
      '3ds max',
      'fusion',
    ],
  },
  { slug: 'geo5', title: 'GEO5', words: ['geo5', 'geo 5', 'fine software'] },
  { slug: 'scad', title: 'SCAD Soft', words: ['scad', 'скад'] },
  { slug: 'lira', title: 'ЛИРА-FEM', words: ['лира', 'lira'] },
  { slug: 'abc', title: 'АВС-KZ', words: ['авс', 'abc-kz'] },
  { slug: 'artec', title: 'Artec 3D', words: ['artec', 'артек'] },
  { slug: 'nanosoft', title: 'Nanosoft', words: ['nanocad', 'нанокад', 'nanosoft'] },
  {
    slug: 'csoft',
    title: 'CSoft',
    words: ['csoft', 'спдс', 'tdms', 'rasterdesk', 'project studio', 'magicad'],
  },
]

/** Производитель по адресу (?vendor=…) или null. */
export function newsVendor(slug) {
  return NEWS_VENDORS.find((vendor) => vendor.slug === slug) ?? null
}

/**
 * Условие отбора публикаций производителя для Payload: любое из слов в заголовке, анонсе
 * или тексте (contains — без учёта регистра).
 * @param {{ words: string[] }} vendor
 * @returns {{ or: Record<string, { contains: string }>[] }}
 */
export function vendorWhere(vendor) {
  return {
    or: vendor.words.flatMap((word) => [
      { title: { contains: word } },
      { excerpt: { contains: word } },
      { body: { contains: word } },
    ]),
  }
}
