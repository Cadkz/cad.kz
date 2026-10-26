/** Состав сверён с Autodesk 26.10.2026. Это справка при показе, не товары и не цены CMS. */
const collections = [
  {
    key: 'aec',
    pattern:
      /\baec\s*collection\b|architecture[\s_,-]*engineering[\s_&,-]*(?:and[\s_-]*)?construction[\s_-]*collection/i,
    source:
      'https://www.autodesk.com/collections/architecture-engineering-construction/included-software',
    included: [
      'Revit',
      'AutoCAD',
      'Civil 3D',
      'Navisworks Manage',
      'InfraWorks',
      '3ds Max',
      'ReCap Pro',
      'Robot Structural Analysis Professional',
      'Advance Steel',
      'Fabrication CADmep',
      'Forma Site Design',
      'Forma Building Design',
      'Forma Data Management',
      'Insight',
      'Autodesk Rendering',
      'Twinmotion for Revit',
    ],
    summary: 'Набор для BIM, чертежей, инфраструктуры и координации проекта.',
    benefit:
      'AutoCAD и Revit входят в одну подписку вместе с Civil 3D, Navisworks Manage и другими инструментами. Имеет смысл сравнить с отдельными лицензиями, если одному специалисту нужны несколько программ. Выгоду в тенге рассчитаем по нужному сроку и составу лицензий.',
    note: 'Revit + AutoCAD + Civil 3D и другие программы в одной подписке',
  },
  {
    key: 'pdm',
    pattern:
      /product[\s_-]*design[\s_&,-]*(?:and[\s_-]*)?manufacturing[\s_-]*collection|\bpdm[c]?\s*collection\b/i,
    source: 'https://www.autodesk.com/collections/product-design-manufacturing/included-software',
    included: [
      'Inventor',
      'AutoCAD',
      'Fusion',
      'Navisworks Manage',
      '3ds Max',
      'Vault Basic',
      'ReCap Pro',
      'Factory Design Utilities',
      'Inventor CAM Ultimate',
      'Inventor Nastran',
      'Inventor Tolerance Analysis',
      'Inventor Nesting',
      'Autodesk Drive',
      'Autodesk Rendering',
    ],
    summary: 'Набор для конструирования, расчётов и подготовки производства.',
    benefit:
      'Inventor, AutoCAD и Fusion вместе с инструментами расчёта и подготовки производства — в одной подписке. Сравним стоимость коллекции с отдельными лицензиями под ваши задачи и срок.',
    note: 'Inventor + AutoCAD + Fusion и инструменты производства',
  },
  {
    key: 'me',
    pattern: /media[\s_&,-]*(?:and[\s_-]*)?entertainment[\s_-]*collection|\bm&e\s*collection\b/i,
    source: 'https://www.autodesk.com/collections/media-entertainment/buy',
    included: [
      'Maya',
      '3ds Max',
      'Arnold',
      'MotionBuilder',
      'Mudbox',
      'Golaem для Maya',
      'Flow Studio',
      'Character Generator',
      'ReCap Pro',
      'Autodesk Rendering',
      'Bifrost для Maya',
    ],
    summary: 'Набор для 3D-моделирования, анимации, эффектов и визуализации.',
    benefit:
      'Инструменты от моделирования до рендеринга — в одной подписке. Коллекция удобна, когда нужны несколько приложений; стоимость сравним с отдельными лицензиями. Вариант лицензирования Arnold уточняется при заказе.',
    note: 'Maya + 3ds Max + Arnold и инструменты анимации',
  },
]

/** @param {{title: string, slug?: string, manufacturer?: string | null, vendor?: string | null}} item */
export function collectionInfo(item) {
  const vendor = item.manufacturer ?? item.vendor
  if (vendor && !/autodesk/i.test(vendor)) return null
  return collections.find((entry) => entry.pattern.test(`${item.title} ${item.slug ?? ''}`)) ?? null
}

/** Тип определяется по имеющимся полям CMS; отдельное поле можно добавить позже. */
/** @param {{kind: string, title: string, requiresProducts?: unknown[] | null}} product */
export function entryType(product) {
  if (product.kind === 'course') return 'Курс'
  if (product.kind === 'service') return 'Услуга'
  if (product.kind === 'hardware') return 'Оборудование'
  if (collectionInfo(product)) return 'Коллекция'
  if (product.requiresProducts?.length) return 'Модуль'
  if (/нормативн\S*\s+баз|сметно-нормативн|\bнсб\b/iu.test(product.title)) return 'Нормативная база'
  return 'Программа'
}
