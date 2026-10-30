// @ts-check
// Каталог Autodesk по решению владельца 29.10.2026 (src/lib/autodeskCatalogSetup.ts).
// Чистые данные без базы. Состав коллекций — по страницам autodesk.com «Included software»
// (AEC, Product Design & Manufacturing, Media & Entertainment), сверено 29.10.2026.

/**
 * Программы Autodesk, которые остаются на сайте (адреса товаров). Всё остальное ПО Autodesk
 * скрывается (черновик): вернуть можно в админке, «Активность» → «Да». Курсы не трогаем.
 * AutoCAD LT (autocad_lt_for_mac) своей страницы не имеет — это вариант в подборе AutoCAD.
 */
export const AUTODESK_KEEP = [
  'architecture_engineering_construction_collection-1107088405',
  'product_design_manufacturing_collection',
  'media_entertainment_collection_ic',
  'autocad',
  'autocad_lt_for_mac',
  'autocad_revit_lt_suite',
  'autodesk-revit',
  'civil_3d',
  'infraworks',
  'navisworks',
  'advance_steel',
  '3ds_max',
  'recap_pro',
  'inventor_professional',
  'fusion_360_cloud',
]

/** Fusion 360 CLOUD → Fusion Cloud (владелец: три Fusion — для дизайна, для производства, Cloud). */
export const AUTODESK_RENAMES = {
  fusion_360_cloud: { title: 'Fusion Cloud', aliases: 'fusion 360 cloud, фьюжн клауд, фьюжн' },
}

/**
 * Новые товары. Цены нет — на сайте «Запросить цену», менеджер считает. Раздел, линейка и
 * производитель — от товара-образца (copyFrom). none — без своей страницы, вариант в подборе.
 * @type {{ slug: string, title: string, copyFrom: string, pageView: 'standard' | 'none', aliases: string, summary: string, description: string }[]}
 */
export const AUTODESK_NEW = [
  {
    slug: 'revit_lt',
    title: 'Revit LT',
    copyFrom: 'autodesk-revit',
    pageView: 'none',
    aliases: 'ревит лт, revit lt',
    summary: 'Упрощённый Revit для архитектурной BIM-модели и чертежей из неё.',
    description: [
      'Revit LT — упрощённая версия Revit для архитектурного проектирования: BIM-модель здания, ' +
        'планы, разрезы, фасады и спецификации из одной модели.',
      'В отличие от полного Revit, нет инструментов для конструкций и инженерных систем, ' +
        'совместной работы над одной моделью, рендеринга в облаке и дополнений сторонних ' +
        'разработчиков. Файлы открываются в полном Revit.',
    ].join('\n\n'),
  },
  {
    slug: 'robot_structural_analysis',
    title: 'Robot Structural Analysis Professional',
    copyFrom: 'advance_steel',
    pageView: 'standard',
    aliases: 'robot, робот, robot structural, роботстракчурал',
    summary: 'Расчёт строительных конструкций методом конечных элементов, связь с Revit.',
    description: [
      'Robot Structural Analysis Professional — программа для расчёта строительных конструкций: ' +
        'статика, динамика, сейсмика, проверка стальных и железобетонных элементов по нормам.',
      'Модель передаётся из Revit и обратно, результаты расчёта обновляют BIM-модель. ' +
        'Входит в AEC Collection.',
    ].join('\n\n'),
  },
  {
    slug: 'fusion_for_design',
    title: 'Fusion for Design',
    copyFrom: 'fusion_360_cloud',
    pageView: 'standard',
    aliases: 'fusion for design, fusion для дизайна, фьюжн для дизайна, фьюжн',
    summary: 'Fusion с расчётами, генеративным дизайном, сложными поверхностями и PLM.',
    description: [
      'Autodesk Fusion for Design — Fusion для конструкторов: к основным возможностям добавлены ' +
        'расчёты (симуляция), генеративный дизайн, продвинутое моделирование поверхностей, ' +
        'управление данными и PLM.',
    ].join('\n\n'),
  },
  {
    slug: 'fusion_for_manufacturing',
    title: 'Fusion for Manufacturing',
    copyFrom: 'fusion_360_cloud',
    pageView: 'standard',
    aliases: 'fusion for manufacturing, fusion для производства, фьюжн для производства, фьюжн',
    summary: 'Fusion с расширенным ЧПУ: от 2D до 5-осевой обработки, контроль на станке.',
    description: [
      'Autodesk Fusion for Manufacturing — Fusion для производства: к основным возможностям ' +
        'добавлены продвинутые стратегии ЧПУ, обработка от 2D до 5 осей, контроль и ' +
        'измерения на станке.',
    ].join('\n\n'),
  },
]

/** AutoCAD — отраслевые наборы, одной строкой в составе коллекций. */
const AUTOCAD_LINE =
  '- AutoCAD с отраслевыми наборами: Architecture, Electrical, Map 3D, Mechanical, MEP, Plant 3D, Raster Design'

/** Состав коллекций: раздел «Что входит в коллекцию» в описании заменяется этим списком. */
export const COLLECTION_CONTENTS = {
  'architecture_engineering_construction_collection-1107088405': [
    '- Revit',
    AUTOCAD_LINE,
    '- Civil 3D',
    '- InfraWorks',
    '- Navisworks Manage',
    '- Robot Structural Analysis Professional',
    '- Advance Steel',
    '- Fabrication CADmep',
    '- 3ds Max',
    '- ReCap Pro',
    '- Forma Building Design и Forma Site Design',
    '- Forma Data Management',
    '- Insight',
    '- Twinmotion for Revit',
    '- Autodesk Rendering',
  ],
  product_design_manufacturing_collection: [
    '- Inventor Professional с Inventor CAM, Inventor Nastran, Inventor Tolerance Analysis и Inventor Nesting',
    AUTOCAD_LINE,
    '- Fusion',
    '- Navisworks Manage',
    '- 3ds Max',
    '- Vault Basic',
    '- Factory Design Utilities',
    '- ReCap Pro',
    '- Autodesk Drive',
    '- Autodesk Rendering',
  ],
  media_entertainment_collection_ic: [
    '- Maya',
    '- 3ds Max',
    '- Arnold',
    '- MotionBuilder',
    '- Mudbox',
    '- Bifrost for Maya',
    '- Golaem',
    '- Autodesk Flow Studio (бывш. Wonder Studio)',
    '- ReCap Pro',
    '- Character Generator',
    '- Autodesk Rendering',
  ],
}

export const CONTENTS_HEADING = '## Что входит в коллекцию'

/**
 * Описание с новым составом: прежний раздел «Что входит в коллекцию» (до следующего заголовка
 * «## » или конца) заменяется, а если его не было — добавляется в конец.
 * @param {string | null | undefined} description
 * @param {string[]} items
 * @returns {string}
 */
export function withContents(description, items) {
  const block = `${CONTENTS_HEADING}\n\n${items.join('\n')}`
  const text = (description ?? '').trim()
  const start = text.indexOf(CONTENTS_HEADING)
  if (start < 0) return text ? `${text}\n\n${block}` : block
  const rest = text.slice(start + CONTENTS_HEADING.length)
  const next = rest.search(/\n## /)
  const tail = next < 0 ? '' : rest.slice(next).trim()
  const head = text.slice(0, start).trim()
  return [head, block, tail].filter(Boolean).join('\n\n')
}

/**
 * Подбор AutoCAD и Revit: в шаге «Продукт» только сам продукт и его LT. LT комплект — отдельный
 * товар со своей страницей. Новые варианты добавляются в конец шага.
 * @type {Record<string, { drop: string[], add: { slug: string, label: string, note: string }[] }>}
 */
export const PICKER_PRODUCTS = {
  autocad: { drop: ['autocad_revit_lt_suite'], add: [] },
  'autodesk-revit': {
    drop: ['autocad_revit_lt_suite'],
    add: [{ slug: 'revit_lt', label: 'Revit LT', note: 'Только архитектурная модель' }],
  },
}

/**
 * Скрывать ли программу Autodesk: всё ПО, кроме оставленных и новых. Курсы и услуги — нет.
 * @param {{ slug: string, kind: string }} product
 */
export function hideAutodesk(product) {
  if (product.kind !== 'software') return false
  return (
    !AUTODESK_KEEP.includes(product.slug) &&
    !AUTODESK_NEW.some((entry) => entry.slug === product.slug)
  )
}
