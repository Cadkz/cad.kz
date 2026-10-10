import assert from 'node:assert/strict'
import test from 'node:test'
import {
  EXTRA_ORDER,
  licenseVariants,
  planExtras,
  planFamilies,
  usedLicenseSwitches,
} from '../src/domain/familySeed.mjs'

const p = (id, vendor, title, skip = false) => ({ id, vendor, title, skip })
const familyOf = (plan, id) => plan.families.find((f) => f.members.some((m) => m.id === id))?.slug

test('товар попадает в первое подходящее семейство своего производителя', () => {
  const plan = planFamilies([
    p(1, 'Csoft Development', 'СПДС GraphiCS'),
    p(2, 'Csoft Development', 'TDMS (7.x (Client)'),
    p(
      3,
      'НТП Трубопровод',
      'Программное обеспечение Revit -Изоляция, перевод локального рабочего места в сетевое',
    ),
    p(4, 'НТП Трубопровод', 'Изоляция'),
    p(
      5,
      'Chaos Group',
      'Phoenix FD 3.0 для Maya, для студентов/преподавателей, на 1 год, английский',
    ),
    p(6, 'Chaos Group', 'Ключ аппаратной защиты dongle для Vray'),
    p(7, 'MagiCAD', 'MagiCAD Вентиляция для Revit'),
    p(8, 'MagiCAD', 'MagiCAD Вентиляция'),
    p(9, 'АСКОН', 'Материалы и Сортаменты для КОМПАС v18, лицензия'),
    p(10, 'Autodesk', 'AutoCAD'),
  ])
  assert.equal(familyOf(plan, 1), 'spds')
  assert.equal(familyOf(plan, 2), 'tdms')
  assert.equal(familyOf(plan, 3), 'ntp-revit')
  assert.equal(familyOf(plan, 4), 'izolyatsiya')
  assert.equal(familyOf(plan, 5), 'chaos-education')
  assert.equal(familyOf(plan, 6), 'v-ray')
  assert.equal(familyOf(plan, 7), undefined)
  assert.equal(familyOf(plan, 8), undefined)
  assert.equal(familyOf(plan, 9), 'kompas-libraries')
  assert.equal(familyOf(plan, 10), undefined)
  assert.deepEqual(plan.unmatched, [])
})

test('продления и обновления — в конце семейства, основные — по названию', () => {
  const plan = planFamilies([
    p(
      1,
      'НТП Трубопровод',
      'Программное обеспечение Предклапан (Windows), локальное рабочее место, Upgrade с предыдущих версий, 1-й льготный период',
    ),
    p(2, 'НТП Трубопровод', 'Предклапан'),
    p(3, 'Csoft Development', 'ElectriCS PRO, Subscription'),
    p(4, 'Csoft Development', 'ElectriCS PRO'),
    p(5, 'Csoft Development', 'ElectriCS ADT'),
  ])
  const pk = plan.families.find((f) => f.slug === 'predklapan')
  assert.deepEqual(
    pk.members.map((m) => [m.id, m.order]),
    [
      [2, 1],
      [1, EXTRA_ORDER + 1],
    ],
  )
  const el = plan.families.find((f) => f.slug === 'electrics')
  assert.deepEqual(
    el.members.map((m) => [m.id, m.extra]),
    [
      [5, false],
      [4, false],
      [3, true],
    ],
  )
})

test('товар с подбором или своей линейкой не трогаем, чужой — в «без семейства»', () => {
  const plan = planFamilies([
    p(1, 'НТП Трубопровод', 'СТАРТ - Проф', true),
    p(2, 'Csoft Development', 'Неизвестная программа'),
  ])
  assert.equal(plan.families.length, 0)
  assert.deepEqual(
    plan.unmatched.map((u) => u.id),
    [2],
  )
})

test('«Ресурс» — в семействе СТАРТ', () => {
  const plan = planFamilies([p(1, 'НТП Трубопровод', 'Ресурс')])
  assert.equal(familyOf(plan, 1), 'start')
})

test('Model Studio и MagiCAD — группы, продления и Suite — варианты, PlanTracer — в черновики', () => {
  const extras = planExtras([
    p(1, 'Csoft Development', 'Model Studio CS Трубопроводы'),
    p(2, 'Csoft Development', 'Подписка на обновления Model Studio CS Трубопроводы'),
    p(3, 'Csoft Development', 'CADLib Модель и Архив'),
    p(4, 'MagiCAD', 'MagiCAD Трубопроводы'),
    p(5, 'MagiCAD', 'MagiCAD Трубопроводы для Revit'),
    p(6, 'MagiCAD', 'MagiCAD Suite Трубопроводы'),
    p(7, 'MagiCAD', 'MagiCAD Помещение'),
    p(8, 'Csoft Development', 'PlanTracer Pro'),
  ])
  assert.deepEqual(
    extras.lines.map((l) => [l.title, l.ids]),
    [
      ['Model Studio CS и CADLib', [3, 1]],
      ['MagiCAD для Revit', [5]],
      ['MagiCAD для AutoCAD', [7, 4]],
    ],
  )
  assert.deepEqual(
    extras.options.map((o) => [o.productId, o.items.map((i) => i.productId)]),
    [
      [1, [1, 2]],
      [4, [4, 6]],
      [5, [5, 6]],
    ],
  )
  assert.deepEqual(extras.noPage.sort(), [2, 6])
  assert.deepEqual(extras.drafts, [8])
})

test('вид и срок лицензии из условий предложения', () => {
  assert.deepEqual(licenseVariants('сетевая, доп. место, на 2 года'), [
    'Сетевая: доп. место',
    '2 года',
  ])
  assert.deepEqual(licenseVariants('локальная лицензия, бессрочная'), ['Локальная', 'Бессрочная'])
  assert.deepEqual(licenseVariants(null), [])
  const switches = usedLicenseSwitches([
    ['Локальная', '1 год'],
    ['Сетевая: сервер', '1 год'],
  ])
  assert.deepEqual(
    switches.map((s) => [s.title, s.options.map((o) => o.value)]),
    [['Вид лицензии', ['Локальная', 'Сетевая: сервер']]],
  )
})
