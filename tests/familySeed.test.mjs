import assert from 'node:assert/strict'
import test from 'node:test'
import { EXTRA_ORDER, planFamilies } from '../src/domain/familySeed.mjs'

const p = (id, vendor, title, skip = false) => ({ id, vendor, title, skip })
const familyOf = (plan, id) => plan.families.find((f) => f.members.some((m) => m.id === id))?.slug

test('товар попадает в первое подходящее семейство своего производителя', () => {
  const plan = planFamilies([
    p(1, 'Csoft Development', 'Model Studio CS Электрика'),
    p(2, 'Csoft Development', 'Подписка на обновления CADLib Модель и Архив'),
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
  assert.equal(familyOf(plan, 1), 'model-studio-cs')
  assert.equal(familyOf(plan, 2), 'model-studio-cs')
  assert.equal(familyOf(plan, 3), 'ntp-revit')
  assert.equal(familyOf(plan, 4), 'izolyatsiya')
  assert.equal(familyOf(plan, 5), 'chaos-education')
  assert.equal(familyOf(plan, 6), 'v-ray')
  assert.equal(familyOf(plan, 7), 'magicad-revit')
  assert.equal(familyOf(plan, 8), 'magicad-autocad')
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
    p(1, 'MagiCAD', 'MagiCAD Схемы', true),
    p(2, 'НТП Трубопровод', 'Ресурс'),
  ])
  assert.equal(plan.families.length, 0)
  assert.deepEqual(
    plan.unmatched.map((u) => u.id),
    [2],
  )
})
