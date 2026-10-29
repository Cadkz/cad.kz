// @ts-check
// Autodesk Forma в каталоге по решению владельца 29.10.2026 (src/lib/formaCatalogSetup.ts).
// Чистые данные без базы. Forma — облачная платформа Autodesk (в марте 2026 в неё переименован
// Autodesk Construction Cloud). На сайте — только то, что входит в AEC Collection, как на
// pro.cad.kz/aec: Site Design, Building Design и Data Management (бывш. Autodesk Docs).
// Design Collaboration, Model Coordination и стройка (Build, Takeoff, Estimate) — нет.

/** Линейки Autodesk: папки в каталоге и меню, по порядку. */
export const AUTODESK_LINES = {
  programs: { title: 'Программы', order: 10 },
  collections: { title: 'Коллекции', order: 20 },
  forma: {
    title: 'Autodesk Forma',
    order: 30,
    summary: 'Облачная платформа: участок, концепция здания и общая среда данных',
  },
}

/** Коллекции Autodesk (адреса товаров) — в линейку «Коллекции». */
export const COLLECTION_SLUGS = [
  'architecture_engineering_construction_collection-1107088405',
  'product_design_manufacturing_collection',
  'media_entertainment_collection_ic',
]

/**
 * Autodesk Docs → Forma Data Management: адрес старый (ссылки и поиск не теряются), название,
 * описание и коротко для карточки — новые. Товар снова на сайте (29.10 был скрыт).
 */
export const DATA_MANAGEMENT_SLUG = 'bim_360_docs'

const INCLUDED =
  'Входит в AEC Collection. Отдельно — годовая подписка, цену и срок поставки подскажет менеджер.'

/**
 * Три продукта Forma: что пишем на сайте. slug — адрес товара; новые создаются по образцу
 * Autodesk Docs (раздел и производитель), без цены — на сайте «Запросить цену».
 * @type {{ slug: string, title: string, isNew: boolean, aliases: string, summary: string, description: string }[]}
 */
export const FORMA_PRODUCTS = [
  {
    slug: 'forma_site_design',
    title: 'Forma Site Design',
    isNew: true,
    aliases: 'forma, форма, forma site design, spacemaker, спейсмейкер, анализ участка',
    summary: 'Анализ участка и сравнение вариантов застройки на ранней стадии.',
    description: [
      'Forma Site Design — облачная программа Autodesk для работы с участком до начала ' +
        'проектирования. Архитектор, градостроитель или девелопер загружает рельеф, соседние ' +
        'здания и дороги, набрасывает объёмы и за минуты сравнивает варианты размещения.',
      '## Что умеет',
      [
        '- Контекст участка: рельеф, окружающая застройка и дороги по адресу или координатам, импорт IFC и OBJ',
        '- Объёмы зданий, автоматическая расстановка вариантов застройки, парковки, планы этажей и квартир',
        '- Анализ среды: инсоляция, естественное освещение, ветер, микроклимат, шум, солнечная энергия, тени, виды из окон',
        '- Показатели площадей по каждому варианту',
        '- Forma Board: обсуждение вариантов с заказчиком и командой, рендер в контексте',
      ].join('\n'),
      '## Связь с другими программами',
      'Выбранный вариант переносится в Forma Building Design и Revit без повторного ' +
        'моделирования.',
      INCLUDED,
    ].join('\n\n'),
  },
  {
    slug: 'forma_building_design',
    title: 'Forma Building Design',
    isNew: true,
    aliases: 'forma, форма, forma building design, концепция здания',
    summary: 'Быстрая концепция здания до детальной BIM-модели в Revit.',
    description: [
      'Forma Building Design — облачная программа Autodesk для концепции здания: объём, этажи, ' +
        'квартиры и фасады прорабатываются раньше, чем начинается детальная модель в Revit.',
      '## Что умеет',
      [
        '- Варианты здания на выбранном участке: объём, этажность, планировка этажей и квартир',
        '- Показатели площадей и проверка решений анализом среды прямо в ходе работы',
        '- Перенос концепции в Revit: данные продолжают работать, модель не строится заново',
      ].join('\n'),
      '## Связь с другими программами',
      'Продолжает работу Forma Site Design: вариант застройки с участка становится концепцией ' +
        'здания, а затем моделью Revit.',
      INCLUDED,
    ].join('\n\n'),
  },
  {
    slug: DATA_MANAGEMENT_SLUG,
    title: 'Forma Data Management',
    isNew: false,
    aliases:
      'forma, форма, forma data management, autodesk docs, автодеск докс, bim 360 docs, среда общих данных, сод',
    summary: 'Общая облачная среда данных проекта по ISO 19650, бывш. Autodesk Docs.',
    description: [
      'Forma Data Management (до 2026 года — Autodesk Docs) — облачная среда общих данных ' +
        'проекта по ISO 19650. Все чертежи, модели и документы проекта лежат в одном месте, ' +
        'у каждого участника — свои права доступа.',
      '## Что умеет',
      [
        '- Хранение моделей Revit, Civil 3D, AutoCAD и других форматов с историей версий',
        '- Просмотр моделей и чертежей в браузере и на телефоне без установки программ',
        '- Замечания, пометки и согласования прямо на чертеже или модели',
        '- Права доступа по папкам и ролям, передача комплектов документации',
        '- Forma Board: обсуждение вариантов и проектных решений на живых данных',
      ].join('\n'),
      '## Что входит',
      'Полная версия входит в AEC Collection. Базовая версия (Forma Data Management ' +
        'Essentials) идёт вместе с подпиской на AutoCAD, Revit, Civil 3D и Product Design & ' +
        'Manufacturing Collection. Совместная работа над моделями Revit (Design Collaboration) ' +
        'и поиск коллизий (Model Coordination) в коллекцию не входят — это отдельная подписка, ' +
        'менеджер подскажет.',
    ].join('\n\n'),
  },
]

/**
 * Линейка программы Autodesk: коллекции, Forma или «Программы». Продукты Forma — всегда в свою
 * линейку; остальное — только без линейки (своё из админки не трогаем). null — не трогаем
 * (уже есть линейка, скрыт, не программа).
 * @param {{ slug: string, kind: string, status: string, line: unknown }} product
 * @returns {'programs' | 'collections' | 'forma' | null}
 */
export function autodeskLineOf(product) {
  if (FORMA_PRODUCTS.some((entry) => entry.slug === product.slug)) return 'forma'
  if (product.kind !== 'software' || product.status !== 'published') return null
  if (product.line != null) return null
  if (COLLECTION_SLUGS.includes(product.slug)) return 'collections'
  return 'programs'
}
