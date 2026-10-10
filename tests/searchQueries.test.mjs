// Набор запросов покупателей (аудит ChatGPT №2, 11.10.2026) на выборке настоящих названий с демо.
// Порядок товаров в списке — как в индексе сайта: топы продаж первыми, товары без своей страницы
// (модули, продления) — после остальных. Проверяем, что нужный товар в первых строках.
import assert from 'node:assert/strict'
import test from 'node:test'
import { queryWords, searchDetailed, stem } from '../src/domain/search.mjs'

const P = 'Плоттеры'
const items = [
  {
    title: 'SCAD Office v. 25.1',
    vendor: 'SCAD Soft',
    summary:
      'Вычислительный комплекс для прочностного анализа конструкций методом конечных элементов',
    tasks: ['Статика и динамика МКЭ', 'Сейсмические расчёты'],
    sections: ['Расчёт конструкций'],
  },
  {
    title: 'ЛИРА - FEM (ЛИРА САПР)',
    vendor: 'ЛИРА-FEM',
    summary: 'Расчёт и проектирование строительных конструкций',
    sections: ['Расчёт конструкций'],
  },
  {
    title: 'AutoCAD',
    vendor: 'Autodesk',
    aliases: 'акад, автокад',
    summary: 'САПР для 2D-черчения и 3D-моделирования',
    sections: ['Архитектура и строительство'],
    keywords: 'Продлить подписку',
  },
  {
    title: 'Revit',
    vendor: 'Autodesk',
    summary: 'BIM-платформа для архитектуры, конструкций и инженерных систем',
    sections: ['Архитектура и строительство', 'Инженерные сети'],
  },
  {
    title: 'GEO5',
    vendor: 'Fine Software',
    summary: 'Комплексный пакет программ для геотехнических задач',
    tasks: ['Подпорные стены и котлованы', 'Фундаменты и сваи'],
    sections: ['Геотехника и геология'],
    parts: 'GEO5 Сваи GEO5 Отдельные фундаменты GEO5 Плита GEO5 Устойчивость откоса',
  },
  {
    title: 'Программный комплекс АВС-KZ (АВС-4)',
    vendor: 'АВС',
    aliases: 'смета, сметы, сметная программа',
    summary: 'Программный комплекс по автоматизированному выпуску смет',
    sections: ['Сметы и документооборот'],
  },
  {
    title: 'Artec Leo',
    vendor: 'Artec 3D',
    sections: ['3D-сканеры', 'Машиностроение'],
    keywords: 'Первый в мире беспроводной 3D-сканер',
  },
  { title: 'Artec Eva', vendor: 'Artec 3D', sections: ['3D-сканеры', 'Машиностроение'] },
  { title: 'Civil 3D', vendor: 'Autodesk', sections: ['Инфраструктура и генплан'] },
  { title: '3ds Max', vendor: 'Autodesk', aliases: 'макс', sections: ['Визуализация'] },
  {
    title: 'Model Studio CS Отопление и вентиляция',
    vendor: 'Csoft Development',
    sections: ['Инженерные сети'],
  },
  {
    title: 'MagiCAD Вентиляция для Revit',
    vendor: 'MagiCAD',
    sections: ['Инженерные сети'],
  },
  {
    title: 'Программа Фундамент',
    vendor: 'Base',
    summary: 'Расчёт конструкций, работающих в грунте',
    sections: ['Расчёт конструкций', 'Геотехника и геология'],
  },
  {
    title: 'plotWAVE T50/T55',
    vendor: 'Canon',
    sections: [P],
    keywords: 'Плоттер для печати чертежей формата А0',
  },
  {
    title: 'imagePROGRAF TX-3200',
    vendor: 'Canon',
    sections: [P],
    keywords: 'Широкоформатный принтер 36 дюймов',
  },
  { title: 'Canon colorWAVE T60', vendor: 'Canon', sections: [P] },
  {
    title: 'WideTEK 36CL Сканер для плоттеров',
    vendor: 'Image Access',
    sections: ['Широкоформатные сканеры'],
  },
  {
    title: 'Тонер Canon/6692C004AA/colorWAVE T60 Toner BK',
    vendor: 'Canon',
    sections: ['Расходные материалы'],
  },
  {
    title: 'Графическая станция Iridium Line',
    vendor: 'CAD.kz',
    sections: ['Рабочие станции'],
  },
  {
    title: 'Курс Autodesk Revit Архитектурные интерьеры',
    sections: ['Обучение', 'Архитектура и строительство'],
  },
  {
    title: 'Онлайн-курс Civil 3D. Генплан',
    sections: ['Обучение', 'Инфраструктура и генплан'],
  },
  {
    title: 'Программное обеспечение АРС, расчет вентиляции',
    vendor: 'АРС-ПС',
    sections: ['Инженерные сети'],
  },
  {
    title: 'TDMS (7.x (AddIns for AutoCAD)',
    vendor: 'Csoft Development',
    sections: ['Сметы и документооборот'],
  },
  // Без своей страницы: модули, продления — в индексе после остальных.
  {
    title: 'SCAD Универсальный комплект US (SSB + RС+ SS + TS)',
    vendor: 'SCAD Soft',
    sections: ['Расчёт конструкций'],
  },
  {
    title: 'ЗАПРОС - расчет элементов оснований и фундаментов сооружений',
    vendor: 'SCAD Soft',
    sections: ['Геотехника и геология', 'Расчёт конструкций'],
  },
  { title: 'GEO5 Сваи', vendor: 'Fine Software', sections: ['Геотехника и геология'] },
  {
    title: 'GEO5 Отдельные фундаменты',
    vendor: 'Fine Software',
    sections: ['Геотехника и геология'],
  },
  {
    title: 'SpotLight, Subscription',
    vendor: 'Csoft Development',
    sections: ['Сметы и документооборот'],
  },
  {
    title:
      'Программное обеспечение Изоляция (Windows), локальное рабочее место, Upgrade с предыдущих версий, 1-й льготный период',
    vendor: 'НТП Трубопровод',
    sections: ['Технологические трубопроводы'],
  },
]

/** Первые n названий выдачи. */
const top = (query, n = 3) =>
  searchDetailed(items, query)
    .items.slice(0, n)
    .map((item) => item.title)

/** [запрос, что должно быть в первых строках, сколько строк смотреть] */
const CASES = [
  ['скад офис', 'SCAD Office v. 25.1', 1],
  ['SCAD Office', 'SCAD Office v. 25.1', 1],
  ['обновить скад', 'SCAD Office v. 25.1', 1],
  ['продлить автокад', 'AutoCAD', 1],
  ['автокад', 'AutoCAD', 1],
  ['акад', 'AutoCAD', 1],
  ['ревит', 'Revit', 1],
  ['лира сапр', 'ЛИРА - FEM (ЛИРА САПР)', 1],
  ['гео5', 'GEO5', 1],
  ['civil 3d', 'Civil 3D', 1],
  ['цивил', 'Civil 3D', 1],
  ['3ds max', '3ds Max', 1],
  ['плоттер', 'plotWAVE T50/T55', 3],
  ['плоттер', 'imagePROGRAF TX-3200', 3],
  ['плоттер А0', 'plotWAVE T50/T55', 1],
  ['плоттер а1', 'Canon colorWAVE T60', 3],
  ['3д сканер', 'Artec Leo', 2],
  ['сканер', 'Artec Leo', 3],
  ['артек', 'Artec Leo', 1],
  ['программа для вентиляции', 'Программное обеспечение АРС, расчет вентиляции', 3],
  ['программа для вентиляции', 'Model Studio CS Отопление и вентиляция', 3],
  ['BIM для инженерных сетей', 'Revit', 3],
  ['расчёт фундаментов', 'Программа Фундамент', 3],
  ['расчет конструкций', 'SCAD Office v. 25.1', 2],
  ['расчет конструкций', 'ЛИРА - FEM (ЛИРА САПР)', 2],
  ['сваи', 'GEO5', 2],
  ['смета', 'Программный комплекс АВС-KZ (АВС-4)', 1],
  ['сметы казахстан', 'Программный комплекс АВС-KZ (АВС-4)', 1],
  ['тонер', 'Тонер Canon/6692C004AA/colorWAVE T60 Toner BK', 1],
  ['рабочая станция', 'Графическая станция Iridium Line', 1],
  ['курсы revit', 'Курс Autodesk Revit Архитектурные интерьеры', 1],
  ['купить автокад цена', 'AutoCAD', 1],
]

test('набор запросов покупателей: нужный товар в первых строках', () => {
  for (const [query, expected, n] of CASES)
    assert.ok(top(query, n).includes(expected), `${query}: ${top(query, 5).join(' | ')}`)
})

test('служебные и общие слова не обязательны, продление — необязательное слово', () => {
  assert.deepEqual(queryWords('программа для вентиляции'), {
    required: ['вентиляции'],
    optional: ['программа'],
  })
  assert.deepEqual(queryWords('обновить скад'), { required: ['скад'], optional: ['обновить'] })
  // Только общее слово — оно и ищется.
  assert.deepEqual(queryWords('программа'), { required: ['программа'], optional: [] })
})

test('основа слова: окончания не мешают', () => {
  assert.equal(stem('вентиляции'), stem('вентиляция'))
  assert.equal(stem('сетей'), stem('сети'))
  assert.equal(stem('сканеры'), 'сканер')
  assert.equal(stem('revit'), 'revit')
})

test('плоттер — сами плоттеры выше сканера «для плоттеров»', () => {
  assert.notEqual(top('плоттер', 1)[0], 'WideTEK 36CL Сканер для плоттеров')
})

test('не нашлись все слова — похожие товары с пометкой', () => {
  const found = searchDetailed(items, 'плоттер hp')
  assert.equal(found.partial, true)
  assert.ok(found.items.some((item) => item.title === 'plotWAVE T50/T55'))
  const exact = searchDetailed(items, 'плоттер canon')
  assert.equal(exact.partial, false)
  // Одно слово не нашлось — пусто, без «похожих».
  assert.deepEqual(searchDetailed(items, 'пылесос'), { items: [], partial: false })
})

test('ложных находок нет', () => {
  assert.ok(!top('плоттер', 10).includes('AutoCAD'))
  assert.ok(!top('скад', 10).includes('AutoCAD'))
  assert.ok(!top('3д сканер', 10).includes('3ds Max'))
})

test('другие названия: новые слова дописываются к прежним без повторов', async () => {
  const { mergeAliases } = await import('../src/domain/searchSeed.mjs')
  assert.equal(mergeAliases(null, 'смета, сметы'), 'смета, сметы')
  assert.equal(mergeAliases('авс, Смета', 'смета, сметы'), 'авс, Смета, сметы')
})
