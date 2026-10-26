/**
 * Что это за позиция — одним словом в карточке каталога (пробная ветка redesign/catalog-v2,
 * замечание владельца 26.10.2026: «открываю AEC Collection и не понимаю, что это»). Правила по
 * названию, разделу и сценарию покупки: база не меняется, подпись считается при показе.
 */

/**
 * Коллекции и комплекты: что входит и чем выгодны. Состав — с сайта Autodesk («What's in the
 * collection», октябрь 2026). title — название товара в нашем каталоге, если у программы есть
 * своя страница: тогда пункт состава ведёт на неё.
 */
export const COLLECTIONS = [
  {
    key: 'aec',
    match: /architecture engineering & construction collection|aec collection/i,
    short: 'AEC Collection',
    lead: 'Набор программ Autodesk для архитекторов, конструкторов и инженеров по одной подписке.',
    benefit:
      'По оценке Autodesk, коллекция обычно выгоднее, если нужны хотя бы две-три программы из набора — например, Revit и AutoCAD.',
    contents: [
      { name: 'Revit', title: 'Revit' },
      { name: 'AutoCAD со специализированными наборами', title: 'AutoCAD' },
      { name: 'Civil 3D', title: 'Civil 3D' },
      { name: 'Navisworks Manage', title: 'Navisworks' },
      { name: 'InfraWorks', title: 'InfraWorks' },
      { name: 'Advance Steel', title: 'Advance Steel' },
      { name: 'Robot Structural Analysis Professional' },
      { name: '3ds Max', title: '3ds Max' },
      { name: 'ReCap Pro', title: 'ReCap Pro' },
      { name: 'Fabrication CADmep' },
      { name: 'Forma — концепция здания и участка' },
      { name: 'Insight — энергоанализ' },
      { name: 'Autodesk Rendering' },
    ],
  },
  {
    key: 'pdmc',
    match: /product design & manufacturing collection/i,
    short: 'PDM Collection',
    lead: 'Набор программ Autodesk для машиностроения: проектирование, расчёт, ЧПУ и данные изделия.',
    benefit:
      'По оценке Autodesk, коллекция обычно выгоднее, если нужны хотя бы две-три программы из набора; кроме Inventor и AutoCAD в неё входят CAM, Nastran и Vault.',
    contents: [
      { name: 'Inventor Professional', title: 'Inventor Professional' },
      { name: 'AutoCAD со специализированными наборами', title: 'AutoCAD' },
      { name: 'Fusion', title: 'Fusion 360 Team' },
      { name: 'Inventor CAM' },
      { name: 'Inventor Nastran' },
      { name: 'Inventor Tolerance Analysis' },
      { name: 'Inventor Nesting' },
      { name: 'Factory Design Utilities' },
      { name: 'Vault Basic', title: 'Vault' },
      { name: 'Navisworks Manage', title: 'Navisworks' },
      { name: '3ds Max', title: '3ds Max' },
      { name: 'ReCap Pro', title: 'ReCap Pro' },
    ],
  },
  {
    key: 'me',
    match: /media & entertainment collection/i,
    short: 'M&E Collection',
    lead: 'Набор программ Autodesk для 3D-графики, анимации и визуальных эффектов.',
    benefit:
      'По оценке Autodesk, коллекция обычно выгоднее, если нужны хотя бы две-три программы из набора — например, Maya и 3ds Max.',
    contents: [
      { name: 'Maya', title: 'Maya' },
      { name: '3ds Max', title: '3ds Max' },
      { name: 'Arnold', title: 'Arnold' },
      { name: 'MotionBuilder', title: 'MotionBuilder' },
      { name: 'Mudbox' },
      { name: 'Bifrost для Maya' },
      { name: 'Golaem' },
      { name: 'ReCap Pro', title: 'ReCap Pro' },
    ],
  },
  {
    key: 'lt-suite',
    match: /lt комплект|lt suite/i,
    short: 'AutoCAD + Revit LT',
    lead: 'Две облегчённые программы Autodesk одной подпиской: чертежи и простое BIM-моделирование.',
    benefit: 'Одна подписка вместо двух: удобно, когда нужны и чертежи, и модель здания.',
    contents: [{ name: 'AutoCAD LT' }, { name: 'Revit LT' }],
  },
]

/** Коллекция или комплект, к которому относится товар, по названию. */
export function collectionOf(title) {
  return COLLECTIONS.find((entry) => entry.match.test(title ?? '')) ?? null
}

/** Подпись типа оборудования и услуги по разделу (slug раздела в CMS). */
const TYPE_KINDS = {
  scanners: '3D-сканер',
  plotters: 'Плоттер',
  consumables: 'Расходный материал',
  'wide-scanners': 'Широкоформатный сканер',
  workstations: 'Рабочая станция',
  training: 'Курс',
  consulting: 'Услуга',
}

/** Подписи программ по названию: первое совпадение. */
const TITLE_KINDS = [
  [/^курс|онлайн[- ]курс|очный курс/i, 'Курс'],
  [/подписка на обновлен|upg с предыдущих|обновлени/i, 'Обновление'],
  [/нормативн|сметно|РСНБ/i, 'Нормативная база'],
  [/ключ аппаратной|ключ-носитель/i, 'Ключ защиты'],
  [/(^|\s)(блок|модуль)\s|extension/i, 'Модуль'],
  [/(^|\s)комплект[.\s]/i, 'Комплект'],
]

/** Оборудование и услуги — по разделу; подраздел точнее родителя («Плоттеры» в широкоформате). */
function typeKind(item) {
  const type = [...(item.types ?? [])].reverse().find((slug) => TYPE_KINDS[slug])
  if (type) return TYPE_KINDS[type]
  return item.group === 'service' ? 'Услуга' : 'Оборудование'
}

/**
 * Что это — одним словом: «Программа», «Коллекция», «Линейка», «Модуль», «Нормативная база»,
 * «Обновление», «Плоттер», «Курс»… item — карточка каталога (title, group, types, scope).
 */
export function catalogKind(item) {
  if (item.group === 'hardware' || item.group === 'service') return typeKind(item)
  const title = item.title ?? ''
  const collection = collectionOf(title)
  if (collection) return collection.key === 'lt-suite' ? 'Комплект' : 'Коллекция'
  if (item.scope === 'family') return 'Линейка'
  return TITLE_KINDS.find(([pattern]) => pattern.test(title))?.[1] ?? 'Программа'
}

/**
 * Короткое имя для перечислений («АВС-KZ, АВС АККОРД, Takeoff»): без «Программный комплекс»,
 * версий и пояснений в скобках. Полное название остаётся в карточке и на странице товара.
 */
export function shortTitle(title) {
  const collection = collectionOf(title)
  if (collection) return collection.short
  return (title ?? '')
    .replace(/^программный комплекс\s+/i, '')
    .replace(/^программа\s+/i, '')
    .replace(/^графическая станция\s+/i, '')
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/\s+v\.\s*[\d.]+$/i, '')
    .replace(/\s+-\s+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}
