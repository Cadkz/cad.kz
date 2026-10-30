// @ts-check
// Правки владельца 29.10.2026 (src/lib/autodeskNamesSetup.ts): официальные названия Fusion
// вместо «Fusion для дизайна / для производства»; Navisworks — два товара, Manage и Simulate
// (в описании было «две редакции», а товар один). Чистые данные без базы.

/** Новые названия по адресу товара; прежнее остаётся в поиске. */
export const NAME_FIXES = {
  fusion_for_design: { title: 'Fusion for Design', aliases: 'fusion для дизайна' },
  fusion_for_manufacturing: {
    title: 'Fusion for Manufacturing',
    aliases: 'fusion для производства',
  },
  navisworks: { title: 'Navisworks Manage', aliases: 'navisworks, нэвисворкс, навис' },
}

const COMMON =
  'Сводная модель собирается из файлов Revit, AutoCAD, Civil 3D, IFC и десятков других форматов. ' +
  'Исправления вносят в исходных программах, сводная модель обновляется.'

export const NAVISWORKS_MANAGE = {
  slug: 'navisworks',
  summary: 'Сводная модель проекта и поиск коллизий между разделами — для BIM-координатора.',
  description: [
    'Navisworks Manage — программа BIM-координатора: собирает модели архитектуры, конструкций и ' +
      'инженерных систем в одну и находит, где они пересекаются. Это старшая редакция Navisworks: ' +
      'всё, что умеет Simulate, плюс поиск и учёт коллизий.',
    '## Что умеет',
    [
      '- Поиск коллизий (Clash Detective): пересечения труб, воздуховодов, конструкций, допуски и зазоры',
      '- Учёт коллизий: статусы, ответственные, отчёты к совещаниям',
      '- 4D: график строительства на модели (TimeLiner)',
      '- 5D: объёмы работ по модели (Quantification)',
      '- Просмотр, замечания, анимация и рендер сводной модели',
    ].join('\n'),
    '## Manage или Simulate',
    'Нужно находить пересечения разделов — Manage. Нужны только просмотр, график стройки и ' +
      'объёмы — хватит Simulate, он дешевле. Navisworks Manage входит в AEC Collection.',
    COMMON,
  ].join('\n\n'),
}

export const NAVISWORKS_SIMULATE = {
  slug: 'navisworks_simulate',
  title: 'Navisworks Simulate',
  aliases: 'navisworks simulate, нэвисворкс симулейт, навис',
  summary: 'Сводная модель, 4D-график строительства и объёмы работ — без поиска коллизий.',
  description: [
    'Navisworks Simulate — программа для просмотра сводной модели и моделирования строительства: ' +
      'график работ на модели, объёмы, наглядные материалы для заказчика и подрядчика.',
    '## Что умеет',
    [
      '- Просмотр сводной модели, замечания и пометки',
      '- 4D: график строительства на модели (TimeLiner)',
      '- 5D: объёмы работ по модели (Quantification)',
      '- Анимация и рендер для презентаций',
    ].join('\n'),
    '## Manage или Simulate',
    'В Simulate нет поиска коллизий (Clash Detective) — для координации разделов нужен ' +
      'Navisworks Manage. Simulate в коллекции не входит, продаётся отдельной подпиской.',
    COMMON,
  ].join('\n\n'),
}

/**
 * Характеристики Navisworks для одной из редакций: без «Редакции — …» (и прежних «Возможности»), с названием программы
 * и строкой про коллизии. Артикул — только у того товара, у которого он был.
 * @param {{ name: string, value: string }[]} properties
 * @param {'Manage' | 'Simulate'} edition
 */
export function navisworksProperties(properties, edition) {
  const kept = properties
    .filter((entry) => !/^(редакции|возможности)\s—/i.test(entry.name))
    .filter((entry) => edition === 'Manage' || entry.name.trim().toLowerCase() !== 'артикул')
    .map(({ name, value }) =>
      /программа$/i.test(name) ? { name, value: `Navisworks ${edition}` } : { name, value },
    )
  return [
    ...kept,
    {
      name: 'Возможности — Поиск коллизий',
      value: edition === 'Manage' ? 'Есть (Clash Detective)' : 'Нет, только в Navisworks Manage',
    },
    { name: 'Возможности — 4D-график и объёмы', value: 'Есть' },
  ]
}
