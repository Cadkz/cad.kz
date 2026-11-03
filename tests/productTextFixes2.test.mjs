import assert from 'node:assert/strict'
import test from 'node:test'
import { courseSummary, isModuleSummary } from '../src/domain/lpCoursePage.mjs'
import {
  canonCleanup,
  fixedTitle,
  isRetired,
  magicadCleanup,
  PRODUCT_TEXTS_2,
  seoFromPhrase,
  stage2Description,
  summaryFromPhrase,
} from '../src/domain/productTextFixes2.mjs'
import { titleDash } from '../src/domain/titleDash.mjs'

test('названия: TDMS, «Право на использование», НТП без деления по тире, Chaos по-русски', () => {
  assert.equal(fixedTitle('TDMS (7.x (Client)'), 'TDMS Client')
  assert.equal(
    fixedTitle(
      'Право на использование программного обеспечения CS EnerGuide (сетевая лицензия на 10 мест)',
    ),
    'CS EnerGuide (сетевая лицензия на 10 мест)',
  )
  assert.equal(fixedTitle('ElectriCS ECP, subscribtion'), 'ElectriCS ECP, Subscription')
  assert.equal(fixedTitle('СТАРТ - Проф'), 'СТАРТ-Проф')
  assert.equal(titleDash(fixedTitle('СТАРТ - Проф')), null)
  assert.equal(fixedTitle('Штуцер - МКЭ'), 'Штуцер-МКЭ')
  assert.equal(fixedTitle('ПАССАТ - базовый'), 'ПАССАТ-Базовый')
  assert.equal(
    fixedTitle('ПАССАТ (модули ПАССАТ-базовый, ПАССАТ-Резервуары) + "Штуцер - МКЭ"'),
    'ПАССАТ (модули ПАССАТ-Базовый, ПАССАТ-Резервуары) + «Штуцер-МКЭ»',
  )
  assert.equal(
    fixedTitle(
      'Программное обеспечение База данных текущего проекта БДТП -Кип, сетевое рабочее место, Upgrade с предыдущих версий, 1-й льготный период',
    ),
    'Программное обеспечение База данных текущего проекта БДТП-КИП, сетевое рабочее место, Upgrade с предыдущих версий, 1-й льготный период',
  )
  assert.equal(
    fixedTitle(
      'Academic licenses, (Main Product), учебный на 1 год, английский, лицензии с 1 по 14 (цена за лицензию)',
    ),
    'Учебная лицензия Chaos, основной продукт, на 1 год, английский, лицензии с 1 по 14 (цена за лицензию)',
  )
  assert.equal(fixedTitle('картридж Océ ColorWave 700 Black'), 'Картридж Océ ColorWave 700 Black')
  // SCAD «АРБАТ - экспертиза…» тире оставляем: карточка делит на название и пояснение.
  assert.equal(fixedTitle('АРБАТ - экспертиза элементов'), 'АРБАТ - экспертиза элементов')
})

test('MagiCAD: «для AutoCAD» в названии, заголовок-повтор и абзацы-заголовки', () => {
  const line = { line: 'MagiCAD для AutoCAD' }
  assert.equal(fixedTitle('MagiCAD Вентиляция', line), 'MagiCAD Вентиляция для AutoCAD')
  assert.equal(fixedTitle('MagiCAD Object Enabler', line), 'MagiCAD Object Enabler')
  assert.equal(
    fixedTitle('MagiCAD Вентиляция', { line: 'MagiCAD для Revit' }),
    'MagiCAD Вентиляция',
  )
  const text = magicadCleanup(
    '## MagiCAD Вентиляция для AutoCAD\n\n## MagiCAD Вентиляция — это мощный модуль для расчёта вентиляции.\n\nНазначение модуля\nМодуль нужен для вентиляции.\n\n## Скачать\n\nСсылка.',
  )
  assert.equal(
    text,
    'MagiCAD Вентиляция — это мощный модуль для расчёта вентиляции.\n\n## Назначение модуля\n\nМодуль нужен для вентиляции.\n\n## Скачать\n\nСсылка.',
  )
  assert.equal(
    magicadCleanup('MagiCAD Схемы для AutoCAD\nПроектирование схем.'),
    'Проектирование схем.',
  )
})

test('Canon: без повтора абзаца, служебных пометок и ширины дважды', () => {
  const draft = [
    'Применяется для чертежей.',
    'Вторая мысль.',
    '## Назначение и область применения',
    'Применяется для чертежей.\n\n- Класс ширины: 36" (A0)',
    '## Технология и качество печати',
    'Canon imagePROGRAF TZ-32000 использует технологию Струйная пигментная. Параметры качества зависят от выбранного материала и режима вывода.\n\n- Максимальная ширина носителя: 36 дюйм\n- Максимальная ширина носителя: 914 мм',
    '## Скорость и печатные очереди',
    'Производительность нужно оценивать при фактическом формате чертежей и загрузке очереди.\n\n- Скорость конкретной конфигурации подтверждается у производителя',
  ].join('\n\n')
  const clean = canonCleanup(draft)
  assert.equal(clean.split('Применяется для чертежей.').length, 2)
  assert.ok(clean.includes('печатает пигментными чернилами.'))
  assert.ok(clean.includes('- Максимальная ширина носителя: 36" (914 мм)'))
  assert.ok(!clean.includes('Параметры качества'))
  assert.ok(!clean.includes('Скорость и печатные очереди'))
})

test('мягкие переносы, опечатки Model Studio, подписка Csoft на 1–3 года', () => {
  const ctx = { vendor: 'Csoft Development', slug: 'x' }
  assert.equal(stage2Description('про­ек­ти­ро­ва­ние', ctx), 'проектирование')
  assert.ok(
    stage2Description('разработки архитектурно-строительная части', ctx).includes(
      'архитектурно-строительной части',
    ),
  )
  assert.ok(stage2Description('Срок действия 1 год', ctx).includes('1, 2 или 3 года'))
})

test('анонс и SEO из фразы карточки', () => {
  assert.equal(
    summaryFromPhrase('Гидравлический расчёт систем отопления'),
    'Гидравлический расчёт систем отопления.',
  )
  assert.equal(summaryFromPhrase(null), null)
  assert.equal(
    seoFromPhrase({ title: 'MagiCAD Вентиляция', kind: 'software', phrase: 'Вентиляция в Revit' }),
    'MagiCAD Вентиляция — вентиляция в Revit. Официальная лицензия в CAD.kz: счёт для юрлиц, оплата картой.',
  )
  assert.equal(seoFromPhrase({ title: 'X', kind: 'software', phrase: null }), '')
})

test('в черновик: переходы на Project Studio CS 2018 и AutomatiCS 2011', () => {
  assert.ok(
    isRetired({
      title:
        'Project Studio CS Архитектура v.3.x -> Project Studio CS Архитектура 2018.x, локальная лицензия, Upgrade',
    }),
  )
  assert.ok(isRetired({ title: 'AutomatiCS 2011' }))
  assert.ok(!isRetired({ title: 'Project Studio CS Архитектура' }))
  assert.ok(!isRetired({ title: 'Онлайн-курс Civil 3D. Генплан' }))
})

test('курсы: подводка «Вы научитесь:» и вопрос не становятся анонсом', () => {
  assert.ok(isModuleSummary('Вы научитесь:'))
  assert.ok(isModuleSummary('Неужели сложное семейство нужно каждый раз создавать с нуля ?'))
  assert.ok(!isModuleSummary('Курс по Revit.'))
  assert.equal(
    courseSummary('Вы научитесь:\n\nКурс про Dynamo для Revit.'),
    'Курс про Dynamo для Revit.',
  )
  for (const entry of PRODUCT_TEXTS_2)
    if (entry.summary) assert.ok(/[.]$/.test(entry.summary.to), entry.slug)
})
