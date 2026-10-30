import assert from 'node:assert/strict'
import test from 'node:test'
import {
  dayText,
  matchPrograms,
  parseCsv,
  parseSchedule,
  periodText,
  pickCourse,
  programs,
  scheduleCsvUrl,
  titleScore,
  upcoming,
} from '../src/domain/courseSchedule.mjs'

const CSV = [
  'Расписание учебных курсов на 3 месяца,,,,,,,,,,,,,,,',
  '№,Наименование курса,Код запуска,Дата начала,Дата завершения,Дни проведения,Время,Место / формат,Преподаватель,Ответственный за курс,Мин. мест,Макс. мест,"Цена по прайсу, ₸","Стоимость за группу, ₸",Программа курса,Статус',
  ',Октябрь 2026,,,,,,,,,,,,,,',
  '1,Онлайн курс «AutoCAD. Основы работы»,2610-ACAD,13.10.2026,27.10.2026,10,19:00-20:30,онлайн ,Габидулин Вилен,Ярлова Евгения,6,10,98 600,591 600,https://l-p.kz/courses/detail.php?ID=2934,Запущен',
  '2,"Онлайн курс «Расчет в ПК LIRA-FEM согласно Евронормам СП РК EN» для продвинутых пользователей",2610-LF,13.10.2026,27.10.2026,9,19:00-21:00,онлайн,Шеховцов Владислав,Ярлова Евгения,5,10,371200,0,https://l-p.kz/courses/detail.php?ID=3297,Отменен',
  ',Декабрь 2026,,,,,,,,,,,,,,',
  '1,Онлайн курс «AutoCAD. Основы работы»,2612-ACAD,01.12.2026,14.12.2026,10,19:00-20:30,онлайн,Габидулин Вилен ,Амангельдинова Махаббат,6,10,98600,591600,https://l-p.kz/courses/detail.php?ID=2934,Набор открыт',
  '2,Онлайн курс «Autodesk Revit для архитектора»,2612-AR,2026-11-05,2026-11-20,12,19:00–21:30,онлайн,Поваляев Александр,Ярлова Евгения,6,10,229680,1378080,https://l-p.kz/courses/detail.php?ID=3377,',
].join('\r\n')

test('таблица расписания: строки, статусы, даты в обоих видах', () => {
  const groups = parseSchedule(parseCsv(CSV))
  assert.ok(groups)
  assert.equal(groups.length, 4)
  assert.deepEqual(
    groups.map((g) => [g.code, g.start, g.status, g.price, g.time]),
    [
      ['2610-ACAD', '2026-10-13', 'started', '98600', '19:00–20:30'],
      ['2610-LF', '2026-10-13', 'cancelled', '371200', '19:00–21:00'],
      ['2612-ACAD', '2026-12-01', 'open', '98600', '19:00–20:30'],
      ['2612-AR', '2026-11-05', 'open', '229680', '19:00–21:30'],
    ],
  )
  assert.equal(groups[0]?.format, 'онлайн')
  assert.equal(parseSchedule([['Код', 'Цена']]), null)
})

test('курсы по номеру программы УЦ, ближайшие открытые группы', () => {
  const groups = parseSchedule(parseCsv(CSV)) ?? []
  const list = programs(groups, '2026-10-30')
  assert.equal(list.length, 3)
  const acad = list.find((p) => p.key === 'lp-2934')
  assert.deepEqual(
    upcoming(acad?.groups ?? [], '2026-10-30').map((g) => g.code),
    ['2612-ACAD'],
  )
  assert.equal(upcoming(groups, '2026-12-02').length, 0)
})

test('сопоставление с каталогом: строго, уровни различаются, «Другие названия» решают', () => {
  assert.ok(titleScore('Онлайн курс Civil 3D. Генплан', 'Онлайн-курс «Civil 3D. Генплан»') === 1)
  assert.equal(
    titleScore(
      'Курс «Расчет в ПК LIRA-FEM согласно Евронормам СП РК EN» с нуля',
      'Онлайн курс «Расчет в ПК LIRA-FEM согласно Евронормам СП РК EN» для продвинутых пользователей',
    ),
    0,
  )
  const list = programs(parseSchedule(parseCsv(CSV)) ?? [], '2026-10-30')
  const matched = matchPrograms(list, [
    { id: 1, title: 'AutoCAD. Основы работы', aliases: [] },
    { id: 2, title: 'Курс Autodesk Revit. Архитектурные интерьеры', aliases: [] },
    { id: 3, title: 'Revit: архитектура', aliases: ['Autodesk Revit для архитектора'] },
  ])
  assert.deepEqual(
    matched.map((m) => [m.program.key, m.courseId]),
    [
      ['lp-2934', 1],
      ['lp-3297', null],
      ['lp-3377', 3],
    ],
  )
})

test('курс к программе: та же программа, меньше лишнего, ближе старт', () => {
  const courses = [
    { title: 'AutoCAD P&ID и AutoCAD Plant 3D', next: '2026-11-23' },
    { title: 'AutoCAD. Основы работы', next: '2026-12-01' },
    { title: '1С:Бухгалтерия', next: '2026-11-01' },
    { title: 'Revit MEP: ОВ и ВК', next: '2026-11-02' },
    { title: 'Autodesk Revit для архитектора', next: '2026-11-05' },
  ]
  assert.equal(pickCourse('AutoCAD', courses)?.title, 'AutoCAD. Основы работы')
  assert.equal(pickCourse('Revit', courses)?.title, 'Autodesk Revit для архитектора')
  assert.equal(pickCourse('АВС-4', courses), null)
})

test('даты словами и адрес таблицы', () => {
  assert.equal(dayText('2026-12-01', '2026-10-30'), '1 декабря')
  assert.equal(dayText('2027-01-12', '2026-10-30'), '12 января 2027')
  const group = { start: '2026-12-01', end: '2026-12-14' }
  assert.equal(periodText(/** @type {never} */ (group), '2026-10-30'), '1–14 декабря')
  assert.equal(
    periodText(/** @type {never} */ ({ start: '2026-10-27', end: '2026-11-11' }), '2026-10-30'),
    '27 октября – 11 ноября',
  )
  assert.match(scheduleCsvUrl(undefined), /1W3jiv1hcm.*\/export\?format=csv$/)
  assert.equal(
    scheduleCsvUrl('https://docs.google.com/spreadsheets/d/abc-1_2/edit?usp=sharing'),
    'https://docs.google.com/spreadsheets/d/abc-1_2/export?format=csv',
  )
  const published = 'https://docs.google.com/spreadsheets/d/e/2PACX-1/pub?output=csv'
  assert.equal(scheduleCsvUrl(published), published)
  assert.equal(scheduleCsvUrl('http://localhost:4000/s.csv'), 'http://localhost:4000/s.csv')
})

test('сверка: есть везде, нет на сайте, лишние на сайте', async () => {
  const { scheduleReport } = await import('../src/domain/courseSchedule.mjs')
  const list = programs(parseSchedule(parseCsv(CSV)) ?? [], '2026-10-30')
  const courses = [
    { id: 1, title: 'AutoCAD. Основы работы', href: '/a' },
    { id: 9, title: 'Курс Model Studio CS Трубопроводы', href: '/m' },
  ]
  const matched = matchPrograms(
    list,
    courses.map((c) => ({ ...c, aliases: [] })),
  )
  const report = scheduleReport(
    matched.map(({ program, courseId }) => ({ ...program, courseId })),
    courses,
    '2026-10-30',
  )
  assert.deepEqual(
    report.linked.map((l) => [l.course.id, l.next?.code, l.price]),
    [[1, '2612-ACAD', '98600']],
  )
  assert.deepEqual(
    report.missing.map((m) => [m.program.key, m.next?.code ?? null]),
    [
      ['lp-3377', '2612-AR'],
      ['lp-3297', null],
    ],
  )
  assert.deepEqual(
    report.extra.map((c) => c.id),
    [9],
  )
})
