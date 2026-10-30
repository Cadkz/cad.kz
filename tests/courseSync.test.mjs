import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { matchPrograms, parseCsv, parseSchedule, programs } from '../src/domain/courseSchedule.mjs'
import {
  courseSlug,
  isAlive,
  lpIdFromKey,
  lpKey,
  planCourseSync,
  tablePrice,
} from '../src/domain/courseSync.mjs'
import { courseSummary, parseCoursePage, tidyProgram } from '../src/domain/lpCoursePage.mjs'

const CSV = [
  '№,Наименование курса,Код запуска,Дата начала,Дата завершения,Дни проведения,Время,Место / формат,Преподаватель,Ответственный за курс,Мин. мест,Макс. мест,"Цена по прайсу, ₸","Стоимость за группу, ₸",Программа курса,Статус',
  '1,Онлайн курс «AutoCAD. Основы работы»,2610-ACAD,13.10.2026,27.10.2026,10,19:00-20:30,онлайн,Г,Я,6,10,98 600,0,https://l-p.kz/courses/detail.php?ID=2934,Запущен',
  '2,Онлайн курс «LIRA-FEM для продвинутых пользователей»,2610-LF,13.10.2026,27.10.2026,9,19:00-21:00,онлайн,Ш,Я,5,10,371200,0,https://l-p.kz/courses/detail.php?ID=3297,Отменен',
  '3,Онлайн курс «AutoCAD. Основы работы»,2612-ACAD,01.12.2026,14.12.2026,10,19:00-20:30,онлайн,Г,А,6,10,99600,0,https://l-p.kz/courses/detail.php?ID=2934,Набор открыт',
  '4,Онлайн курс «Autodesk Revit для архитектора»,2611-AR,05.11.2026,20.11.2026,12,19:00–21:30,онлайн,П,Я,6,10,229680,0,https://l-p.kz/courses/detail.php?ID=3377,',
  '5,Онлайн курс «Civil 3D. Дороги»,2611-C3D,17.11.2026,01.12.2026,10,19:00–21:00,онлайн,И,Я,6,10,189990,0,,',
].join('\n')
const today = '2026-10-30'
const list = programs(parseSchedule(parseCsv(CSV)) ?? [], today)

test('ключ курса, заведённого по таблице, и адрес латиницей', () => {
  assert.equal(lpKey('2934'), 'lp-course-2934')
  assert.equal(lpIdFromKey('lp-course-2934'), '2934')
  assert.equal(lpIdFromKey('demo:products:x'), null)
  assert.equal(courseSlug('Онлайн курс «AutoCAD. Основы работы»'), 'autocad-osnovy-raboty')
  assert.equal(
    courseSlug('Онлайн курс «Autodesk Revit для архитектора»'),
    'autodesk-revit-arhitektora',
  )
  assert.ok(courseSlug('а'.repeat(100)).length <= 60 || courseSlug('а'.repeat(100)) === 'kurs')
})

test('цена — ближайшего запуска с открытым набором; живой курс — с будущим запуском', () => {
  const autocad = list.find((p) => p.key === 'lp-2934')
  assert.ok(autocad)
  assert.equal(tablePrice([autocad], today), '99600')
  assert.equal(isAlive(autocad.groups, today), true)
  const lira = list.find((p) => p.key === 'lp-3297')
  assert.equal(isAlive(lira?.groups ?? [], today), false)
})

test('план: цены отличаются — обновить, нет комплектации — завести, несколько — не трогать', () => {
  const catalog = [
    { id: 1, title: 'AutoCAD. Основы работы', aliases: [] },
    { id: 2, title: 'Revit (переименован)', aliases: [], lpId: '3377' },
    { id: 3, title: 'Civil 3D. Дороги', aliases: [] },
  ]
  const matched = matchPrograms(list, catalog).map(({ program, courseId }) => ({
    ...program,
    courseId,
  }))
  // Курс, заведённый сайтом, узнаётся по номеру l-p.kz и после переименования.
  assert.equal(matched.find((p) => p.key === 'lp-3377')?.courseId, 2)
  const offers = new Map([
    [1, [{ id: 10, amount: '98600', currency: 'KZT', includesVat: true }]],
    [
      3,
      [
        { id: 30, amount: '1', currency: 'KZT', includesVat: true },
        { id: 31, amount: '2', currency: 'KZT', includesVat: true },
      ],
    ],
  ])
  const plan = planCourseSync({ programs: matched, courses: catalog, offers, today })
  assert.deepEqual(plan.prices, [
    {
      productId: 1,
      title: 'AutoCAD. Основы работы',
      offerId: 10,
      amount: '99600',
      before: '98600',
    },
    { productId: 2, title: 'Revit (переименован)', offerId: null, amount: '229680', before: null },
  ])
  assert.deepEqual(plan.skipped, ['Civil 3D. Дороги'])
  // LIRA отменена — не заводится.
  assert.deepEqual(plan.create, [])
  // Та же цена — ничего не пишется.
  const same = new Map([[1, [{ id: 10, amount: '99600', currency: 'KZT', includesVat: true }]]])
  const again = planCourseSync({
    programs: matched,
    courses: catalog.slice(0, 1),
    offers: same,
    today,
  })
  assert.deepEqual(again.prices, [])
})

test('план: курс есть в таблице, на сайте нет — завести один раз (без ссылки l-p.kz — нет)', () => {
  const matched = matchPrograms(list, []).map(({ program, courseId }) => ({ ...program, courseId }))
  const plan = planCourseSync({ programs: matched, courses: [], offers: new Map(), today })
  assert.deepEqual(
    plan.create.map((entry) => entry.key),
    ['lp-course-2934', 'lp-course-3377'],
  )
})

const page = (name) =>
  readFileSync(new URL(`./fixtures/lp-course-${name}.html`, import.meta.url), 'utf8')

test('страница l-p.kz AutoCAD: описание, программа модулями, длительность', () => {
  const course = parseCoursePage(page('autocad'))
  assert.ok(course)
  assert.equal(course.title, 'Онлайн курс «AutoCAD. Основы работы»')
  assert.equal(course.hours, '20 ак. часов')
  assert.match(course.summary, /^Курс предназначен для практического освоения/)
  const blocks = course.description.split('\n\n')
  assert.equal(blocks[3], '## Программа курса')
  assert.equal(blocks[4], '### 1. Основы AutoCAD')
  assert.ok(course.description.includes('### 11. Вывод на печать'))
  assert.ok(!course.description.includes('<'))
})

test('страница l-p.kz Revit: модули строкой и пунктом списка — тоже заголовки', () => {
  const course = parseCoursePage(page('revit'))
  assert.ok(course)
  assert.equal(course.hours, '40 ак. часов')
  assert.match(course.summary, /^Прежде всего данный курс/)
  const heads = course.description.split('\n\n').filter((b) => b.startsWith('### '))
  assert.equal(heads.length, 11)
  assert.equal(heads[0], '### 1. Введение')
  assert.equal(heads[1], '### 2. Моделирование объектов здания')
  assert.equal(course.description.match(/^## Программа курса$/gm)?.length, 1)
})

test('не страница курса — null; разметка и «коротко» без страницы', () => {
  assert.equal(parseCoursePage('<html><body><h1>Нет</h1></body></html>'), null)
  assert.equal(
    tidyProgram('Текст\n\n3. Модуль\n\n- пункт'),
    'Текст\n\n## Программа курса\n\n### 3. Модуль\n\n- пункт',
  )
  assert.equal(courseSummary('## Раздел\n\nДля кого: инженерам. Второе.'), 'Инженерам. Второе.')
})
