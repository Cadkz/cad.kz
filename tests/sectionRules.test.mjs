import assert from 'node:assert/strict'
import test from 'node:test'
import { directionSections, isRetired } from '../src/domain/directionRules.mjs'
import {
  allSections,
  parseWords,
  pickRule,
  sectionsByRules,
  titleMatches,
} from '../src/domain/sectionRules.mjs'
import { regexWords, seedRules } from '../src/domain/sectionRulesSeed.mjs'

test('слова: запятая — любое, плюс — все части, регистр и ё не важны', () => {
  assert.deepEqual(parseWords('Revit, project studio+фундамент'), [
    ['revit'],
    ['project studio', 'фундамент'],
  ])
  assert.equal(titleMatches('', 'что угодно'), true)
  assert.equal(titleMatches('revit, autocad', 'Autodesk REVIT 2025'), true)
  assert.equal(titleMatches('project studio+фундамент', 'Project Studio CS Фундаменты'), true)
  assert.equal(titleMatches('project studio+фундамент', 'Project Studio CS Архитектура'), false)
  assert.equal(titleMatches('ёлка', 'Елка'), true)
})

const rules = [
  { order: 20, vendor: 'Autodesk', kind: null, words: '', main: 'arch', extra: [], retire: false },
  {
    order: 10,
    vendor: 'Autodesk',
    kind: null,
    words: 'civil',
    main: 'infra',
    extra: ['mep', 'infra'],
    retire: false,
  },
  { order: 5, vendor: null, kind: 'course', words: '', main: 'training', extra: [], retire: false },
]

test('правила проверяются по порядку, первое подходящее побеждает', () => {
  const civil = { title: 'Civil 3D', vendor: 'Autodesk', kind: 'software' }
  assert.equal(pickRule(rules, civil)?.order, 10)
  assert.deepEqual(sectionsByRules(rules, civil)?.extra, ['mep'])
  assert.equal(
    pickRule(rules, { title: 'Курс Civil', vendor: 'Autodesk', kind: 'course' })?.order,
    5,
  )
  assert.equal(sectionsByRules(rules, { title: 'X', vendor: 'Другой', kind: 'software' }), null)
})

test('все разделы: основной первым, без повторов и пустых', () => {
  assert.deepEqual(allSections(3, [5, 3, null, 7]), [3, 5, 7])
  assert.deepEqual(allSections(null, [5]), [5])
})

test('регулярные выражения правил переводятся в слова', () => {
  assert.equal(regexWords(/тонер|картридж/i), 'тонер, картридж')
  assert.equal(regexWords(/сапфир.{0,3}жбк/i), 'сапфир+жбк')
  assert.equal(
    regexWords(/model studio.*(трубопровод|технологическ)/i),
    'model studio+трубопровод, model studio+технологическ',
  )
  assert.equal(regexWords(/спдс (железобетон|металло)/i), 'спдс железобетон, спдс металло')
  assert.equal(regexWords(/3ds|v.?ray/i), '3ds, vray, v-ray, v ray')
  assert.equal(regexWords(/\bdocs\b|assemble/i), 'docs, assemble')
})

const samples = [
  ['Artec 3D', 'hardware', 'Artec Leo'],
  ['Artec 3D', 'software', 'Artec Studio 19'],
  ['Image Access', 'hardware', 'WideTEK 36CL'],
  ['Canon', 'hardware', 'Тонер colorWAVE T60 голубой'],
  ['Canon', 'hardware', 'Картридж Océ ColorWave 700'],
  ['Canon', 'hardware', 'imagePROGRAF TX-3200'],
  ['', 'hardware', 'Графическая станция Iridium Line'],
  ['АСКОН', 'course', 'Справочник конструктора'],
  ['', 'course', 'Civil 3D: проектирование автодорог'],
  ['', 'course', 'Civil 3D: проектирование наружных инженерных сетей'],
  ['', 'course', 'Civil 3D: инженерная геодезия и геология'],
  ['', 'course', 'ЛИРА-FEM по СП РК EN'],
  ['', 'course', 'Revit MEP: слаботочные сети'],
  ['', 'course', 'BIM-менеджмент'],
  ['', 'course', 'Model Studio CS Трубопроводы'],
  ['', 'course', '3ds Max + V-Ray с Unreal Engine 5'],
  ['', 'service', 'Корпоративное обучение'],
  ['', 'service', 'Внедрение BIM'],
  ['Fine Software', 'software', 'GEO5 Сваи'],
  ['Fine Software', 'software', 'TRUSS4'],
  ['SCAD Soft', 'software', 'ОТКОС'],
  ['SCAD Soft', 'software', 'SCAD Office 25.1 комплект SS'],
  ['ЛИРА-FEM', 'software', 'ЭСПРИ Грунт'],
  ['ЛИРА-FEM', 'software', 'САПФИР 3D'],
  ['ЛИРА-FEM', 'software', 'САПФИР-ЖБК'],
  ['ЛИРА-FEM', 'software', 'МОНОМАХ-САПР'],
  ['Base', 'software', 'Программа Фундамент'],
  ['Base', 'software', 'Блок расчётов архитектора'],
  ['Base', 'software', 'Блок специальных расчётов'],
  ['Base', 'software', 'Плита'],
  ['MagiCAD', 'software', 'MagiCAD Вентиляция для Revit'],
  ['АРС-ПС', 'software', 'АРС Отопление'],
  ['НТП Трубопровод', 'software', 'ПАССАТ Колонны'],
  ['НТП Трубопровод', 'software', 'СТАРТ-Проф'],
  ['НТП Трубопровод', 'software', 'Предклапан'],
  ['АВС', 'software', 'АВС-KZ'],
  ['АВС', 'software', 'АККОРД'],
  ['Chaos Group', 'software', 'V-Ray для 3ds Max'],
  ['TDMS Фарватер', 'software', 'TDMS Фарватер'],
  ['Csoft Development', 'software', 'TDMS Подписка'],
  ['Csoft Development', 'software', 'CADLib Модель и Архив'],
  ['Csoft Development', 'software', 'RasterDesk Pro'],
  ['Csoft Development', 'software', 'СПДС Железобетон'],
  ['Csoft Development', 'software', 'СПДС GraphiCS'],
  ['Csoft Development', 'software', 'Project Studio CS Фундаменты'],
  ['Csoft Development', 'software', 'Project Studio CS Конструкции'],
  ['Csoft Development', 'software', 'Project Studio CS Архитектура'],
  ['Csoft Development', 'software', 'Model Studio CS Трубопроводы'],
  ['Csoft Development', 'software', 'Model Studio CS Технологические схемы'],
  ['Csoft Development', 'software', 'Model Studio CS Генплан'],
  ['Csoft Development', 'software', 'Model Studio CS Корпоративная лицензия'],
  ['Csoft Development', 'software', 'Model Studio CS Молниезащита'],
  ['Csoft Development', 'software', 'ElectriCS PRO'],
  ['Csoft Development', 'software', 'EnergyCS Электрика'],
  ['Csoft Development', 'software', 'MechaniCS Оборудование'],
  ['Csoft Development', 'software', 'ПолигонСофт Литьё'],
  ['Csoft Development', 'software', 'CS EnerGuide'],
  ['Csoft Development', 'software', 'GeoniCS Изыскания'],
  ['Autodesk', 'software', 'Civil 3D'],
  ['Autodesk', 'software', 'InfraWorks'],
  ['Autodesk', 'software', 'Advance Steel'],
  ['Autodesk', 'software', 'Takeoff Cloud'],
  ['Autodesk', 'software', 'VRED Professional'],
  ['Autodesk', 'software', 'Alias AutoStudio'],
  ['Autodesk', 'software', '3ds Max'],
  ['Autodesk', 'software', 'Flame'],
  ['Autodesk', 'software', 'Inventor Professional'],
  ['Autodesk', 'software', 'Vault Professional'],
  ['Autodesk', 'software', 'Autodesk CFD Premium'],
  ['Autodesk', 'software', 'Fabrication CAMduct'],
  ['Autodesk', 'software', 'Premium SUB'],
  ['Autodesk', 'software', 'Autodesk Docs'],
  ['Autodesk', 'software', 'BIM 360 Build'],
  ['Autodesk', 'software', 'ReCap Pro'],
  ['Autodesk', 'software', 'Revit 2024'],
  ['Autodesk', 'software', 'Architecture Engineering & Construction Collection'],
  ['Autodesk', 'software', 'AutoCAD LT for Mac'],
  ['Autodesk', 'software', 'Navisworks Manage'],
]

const slugOf = (result) => (result ? [result.main, ...result.extra].filter(Boolean) : null)

test('правила для админки дают те же разделы, что утверждённые группы', () => {
  const seeded = seedRules()
  for (const [vendor, kind, title] of samples) {
    const product = { vendor, kind, title }
    assert.deepEqual(
      slugOf(sectionsByRules(seeded, product)),
      directionSections(product),
      `${vendor} ${title}`,
    )
  }
})

test('снятые с продажи программы скрываются правилом', () => {
  const seeded = seedRules()
  for (const title of ['Autodesk SketchBook Pro', 'Maya LT', 'Mudbox', 'TruNest']) {
    const product = { vendor: 'Autodesk', kind: 'software', title }
    assert.equal(isRetired(product), true, title)
    assert.equal(sectionsByRules(seeded, product)?.retire, true, title)
  }
  assert.equal(
    sectionsByRules(seeded, { vendor: 'Autodesk', kind: 'software', title: 'Maya' })?.retire,
    false,
  )
})

test('Artec целиком во втором разделе «Машиностроение»', () => {
  const result = sectionsByRules(seedRules(), {
    vendor: 'Artec 3D',
    kind: 'hardware',
    title: 'Artec Eva',
  })
  assert.deepEqual(slugOf(result), ['scanners', 'machine'])
})
