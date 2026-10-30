import assert from 'node:assert/strict'
import test from 'node:test'
import { toBitrix24Lead } from '../src/domain/bitrix24.mjs'
import { cardAction, resolveScenario, scenarioActions } from '../src/domain/buyScenario.mjs'
import {
  CRM_POPULAR,
  CRM_RULES,
  planRuleOrder,
  seedProductLevel,
  seedScenario,
} from '../src/domain/crmCatalogSeed.mjs'
import { sectionsByRules } from '../src/domain/sectionRules.mjs'
import { itemGroup, topSections, withTopSections } from '../src/domain/sectionTree.mjs'
import { toCrmRequest, validateRenewal, validateRequest } from '../src/domain/siteRequest.mjs'

const labels = (set) => [
  set.main.label,
  set.second?.label ?? null,
  ...set.links.map((a) => a.label),
]

test('сценарий: свой → раздела, если подходит типу → по типу', () => {
  assert.equal(
    resolveScenario({ own: 'renewal', section: 'corporate', kind: 'software' }),
    'renewal',
  )
  assert.equal(resolveScenario({ own: null, section: 'corporate', kind: 'software' }), 'corporate')
  // ReCap в «3D-сканировании»: оборудование программе не подходит.
  assert.equal(resolveScenario({ section: 'equipment', kind: 'software' }), 'standard')
  assert.equal(resolveScenario({ section: 'standard', kind: 'course' }), 'service')
  assert.equal(resolveScenario({ kind: 'hardware' }), 'equipment')
  assert.equal(resolveScenario({ own: 'чужое', kind: 'service' }), 'service')
})

test('кнопки: с ценой — «Купить», без — заявка, демонстрация только у сканеров (30.10.2026)', () => {
  const priced = scenarioActions({ scenario: 'standard', cart: true })
  assert.deepEqual(labels(priced), ['Купить', null])
  assert.equal(priced.main.type, 'cart')
  const autocad = scenarioActions({ scenario: 'standard', cart: false, renewLabel: 'Продлить' })
  assert.deepEqual(labels(autocad), ['Запросить цену', null])
  assert.deepEqual(autocad.main, { type: 'request', kind: 'quote', label: 'Запросить цену' })
  const aec = scenarioActions({ scenario: 'corporate', cart: true })
  assert.deepEqual(labels(aec), ['Запросить цену', null])
  const artec = scenarioActions({ scenario: 'equipment', cart: true, demo: true, picks: true })
  assert.equal(artec.main.type === 'request' && artec.main.kind, 'price')
  assert.deepEqual(labels(artec), ['Запросить цену', null, 'Записаться на демонстрацию'])
  assert.equal(scenarioActions({ scenario: 'equipment', cart: true }).main.type, 'cart')
  assert.deepEqual(labels(scenarioActions({ scenario: 'renewal', cart: true })), ['Продлить', null])
  const course = scenarioActions({ scenario: 'service', kind: 'course', cart: true, about: true })
  assert.equal(course.main.label, 'Записаться на курс')
  assert.equal(scenarioActions({ scenario: 'service', cart: false }).main.label, 'Обсудить проект')
  const family = scenarioActions({ scenario: 'standard', cart: true, family: true })
  assert.equal(family.main.label, 'Запросить цену')
  for (const set of [autocad, aec, course, family]) {
    assert.equal(set.second, null)
    assert.equal(set.links.length, 0)
  }
})

test('карточка каталога: одна кнопка, корзина только у стандартной лицензии', () => {
  assert.deepEqual(cardAction({ scenario: 'standard', cart: true }), { cart: true })
  assert.deepEqual(cardAction({ scenario: 'standard', cart: false }), { cart: false })
  assert.deepEqual(cardAction({ scenario: 'corporate', cart: true }), { cart: false })
  assert.deepEqual(cardAction({ scenario: 'equipment', demo: true, cart: true }), { cart: false })
  assert.equal(cardAction({ scenario: 'equipment', cart: true }).cart, true)
  assert.equal(cardAction({ scenario: 'renewal', cart: true }).cart, false)
  assert.equal(cardAction({ scenario: 'service', cart: true }).cart, false)
})

test('подразделы: товары видны в верхнем разделе, старый подраздел в списке остаётся', () => {
  const top = topSections([
    { id: 1, parent: null },
    { id: 2, parent: 1 },
    { id: 3, parent: 2 },
    { id: 4, parent: 5 },
    { id: 5, parent: 4 },
  ])
  assert.equal(top.get(3), 1)
  assert.equal(top.get(1), 1)
  // Цикл в родителях не зацикливает.
  assert.ok([4, 5].includes(top.get(4)))
  assert.deepEqual(withTopSections([3, 1], top), [1, 3])
  assert.equal(itemGroup('software', 'hardware'), 'hardware')
  assert.equal(itemGroup('software', 'software'), 'software')
  assert.equal(itemGroup('course', 'software'), 'service')
})

/** Новые правила поверх условного прежнего «Autodesk: AutoCAD → Архитектура». */
function rulesWithOld() {
  const fresh = CRM_RULES.map((rule, i) => ({ ...rule, order: 90 + i, retire: false }))
  const old = [
    {
      order: 500,
      vendor: 'Autodesk',
      kind: null,
      words: 'autocad, revit, docs',
      main: 'arch',
      extra: [],
      retire: false,
    },
    {
      order: 510,
      vendor: 'Autodesk',
      kind: null,
      words: 'motionbuilder, 3ds max',
      main: 'viz',
      extra: [],
      retire: false,
    },
    {
      order: 520,
      vendor: 'Csoft Development',
      kind: null,
      words: 'tdms',
      main: 'estimate',
      extra: [],
      retire: false,
    },
  ]
  return [...fresh, ...old]
}

test('правила по CRM: AutoCAD — в «САПР и черчение», TDMS — в «Архитектуру», MotionBuilder не в BIM', () => {
  const rules = rulesWithOld()
  const of = (vendor, title, kind = 'software') => {
    const result = sectionsByRules(rules, { vendor, title, kind })
    return result ? [result.main, ...result.extra] : null
  }
  assert.deepEqual(of('Autodesk', 'AutoCAD'), ['cad', 'arch', 'machine'])
  assert.deepEqual(of('Autodesk', 'AutoCAD Revit LT Suite'), ['arch', 'cad'])
  assert.deepEqual(of('Csoft Development', 'TDMS (7.x (AddIns for AutoCAD)'), ['arch'])
  assert.deepEqual(of('Csoft Development', 'Подписка на обновления TDMS (AddIns for nanoCAD)'), [
    'arch',
  ])
  assert.deepEqual(of('Csoft Development', 'СПДС Металлоконструкции'), [
    'cad',
    'structural',
    'arch',
  ])
  assert.deepEqual(of('Csoft Development', 'SpotLight Pro, Subscription'), ['cad'])
  assert.deepEqual(of('Autodesk', 'MotionBuilder'), ['viz'])
  assert.deepEqual(of('Autodesk', 'Fusion 360 - Additive Build Extension'), ['machine'])
  assert.deepEqual(of('Autodesk', 'BIM 360 Build'), ['arch'])
  assert.deepEqual(of('Autodesk', 'ReCap Pro'), ['scanners', 'arch'])
  assert.deepEqual(of(null, 'Geomagic Design X', 'software'), ['scanners', 'machine'])
  // Курс по AutoCAD остаётся в обучении: новые правила только для программ.
  assert.deepEqual(of('Autodesk', 'Курс AutoCAD для начинающих', 'course'), ['arch'])
})

test('порядок правил: новые сразу за «Снят с продажи», прежние сдвигаются без перестановок', () => {
  const rules = [
    { id: 1, order: 10, retire: true },
    { id: 2, order: 80, retire: true },
    { id: 3, order: 100, retire: false },
    { id: 4, order: 110, retire: false },
  ]
  const plan = planRuleOrder(rules, 3)
  assert.equal(plan.after, 80)
  assert.deepEqual(plan.starts, [90, 100, 110])
  assert.equal(plan.shift, 20) // 100 → 120: после последнего нового (110)
  assert.equal(
    planRuleOrder(
      [
        { id: 1, order: 10, retire: true },
        { id: 2, order: 900, retire: false },
      ],
      3,
    ).shift,
    0,
  )
  assert.deepEqual(planRuleOrder([], 2).starts, [10, 20])
})

test('сценарии и уровни товаров по правилам', () => {
  assert.equal(
    seedScenario({ vendor: 'Csoft Development', title: 'RasterDesk, Subscription' }),
    'renewal',
  )
  assert.equal(seedScenario({ vendor: 'АВС', title: 'СРД сметно-нормативная база' }), 'renewal')
  assert.equal(seedScenario({ vendor: 'Autodesk', title: 'Inventor Professional' }), 'corporate')
  assert.equal(seedScenario({ vendor: 'Autodesk', title: 'Build' }), 'corporate')
  assert.equal(seedScenario({ vendor: 'Autodesk', title: 'MotionBuilder' }), null)
  assert.equal(
    seedScenario({ vendor: 'Csoft Development', title: 'Model Studio CS Трубопроводы' }),
    'corporate',
  )
  assert.equal(seedScenario({ vendor: 'Autodesk', title: 'AutoCAD' }), null)
  assert.equal(seedProductLevel({ vendor: 'Autodesk', title: 'Inventor Professional' }), 'flagship')
  assert.equal(
    seedProductLevel({ vendor: 'Autodesk', title: 'Fusion 360 - Machining Extension' }),
    null,
  )
})

test('популярные решения: порядок владельца, АВС-KZ, плитки из двух программ ведут в каталог', () => {
  assert.equal(CRM_POPULAR.length, 8)
  const order = CRM_POPULAR.map((card) => card.label)
  assert.deepEqual(order.slice(0, 5), [
    'AutoCAD и AutoCAD LT',
    'АВС-KZ',
    'Revit и AEC Collection',
    'SCAD Office',
    'ЛИРА-FEM',
  ])
  const href = (label) => CRM_POPULAR.find((card) => card.label === label)?.href
  assert.equal(href('Inventor и Fusion'), '/catalog?direction=machine&vendor=Autodesk')
  assert.equal(href('Revit и AEC Collection'), '/catalog?direction=arch&vendor=Autodesk')
  assert.match(href('Сканеры Artec') ?? '', /type=scanners&vendor=Artec/)
})

const contact = { name: 'Анна', phone: '+7 701 123 45 67', consent: true }
const key = '0b6c4c1e-1a2b-4c3d-8e9f-0123456789ab'

test('заявка со страницы продления: программа обязательна, без товара', () => {
  const ok = validateRequest({
    ...contact,
    idempotencyKey: key,
    kind: 'renew',
    source: 'renew',
    items: [],
    renewal: { program: 'АВС', license: 'KZ-123/45', seats: '3' },
  })
  assert.equal(ok.ok, true)
  if (!ok.ok) return
  assert.deepEqual(ok.value.renewal, { program: 'АВС', license: 'KZ-123/45', seats: 3 })
  assert.equal(ok.value.pageProductId, null)
  const base = { ...contact, idempotencyKey: key, source: 'renew', items: [] }
  assert.equal(validateRequest({ ...base, kind: 'quote', renewal: { program: 'АВС' } }).ok, false)
  const noProgram = validateRequest({ ...base, kind: 'renew', renewal: { program: '' } })
  assert.equal(noProgram.ok, false)
  if (!noProgram.ok) assert.ok(noProgram.errors.program)
  const badSeats = validateRenewal({ ...contact, renewal: { program: 'GEO5', seats: 0 } })
  assert.equal(badSeats.ok, false)
  assert.equal(validateRenewal({ ...contact, renewal: { program: 'GEO5' } }).ok, true)
})

test('заявка: новые виды и подпись кнопки', () => {
  const ok = validateRequest({
    ...contact,
    idempotencyKey: key,
    kind: 'demo',
    pageProductId: 7,
    items: [{ productId: 7, offerId: null }],
    button: '  Записаться   на демонстрацию ',
  })
  assert.equal(ok.ok, true)
  if (ok.ok) assert.equal(ok.value.button, 'Записаться на демонстрацию')
  const long = validateRequest({
    ...contact,
    idempotencyKey: key,
    kind: 'consult',
    pageProductId: 7,
    items: [],
    button: 'x'.repeat(61),
  })
  assert.equal(long.ok && long.value.button, '')
})

test('Битрикс24: источник заявки в комментарии и «Дополнительно об источнике»', () => {
  const lead = toCrmRequest({
    number: 'REQ-1',
    idempotencyKey: key,
    kind: 'demo',
    pageTitle: 'Artec Leo',
    choices: [],
    name: 'Анна',
    phone: '+77011234567',
    comment: 'Демонстрация: в офисе CAD.kz',
    consentAt: '2026-10-12T00:00:00.000Z',
    lines: [],
    totalKzt: null,
    source: {
      button: 'Записаться на демонстрацию',
      product: 'Artec Leo',
      section: '3D-сканирование',
      scenario: 'Оборудование',
      page: '/catalog/3d_skanery_artec/artec_leo/',
    },
  })
  const fields = toBitrix24Lead(lead).params.fields
  assert.match(
    fields.SOURCE_DESCRIPTION,
    /Кнопка: Записаться на демонстрацию; Товар: Artec Leo; Раздел: 3D-сканирование; Сценарий: Оборудование/,
  )
  assert.match(
    fields.COMMENTS,
    /Откуда: Записаться на демонстрацию, страница \/catalog\/3d_skanery_artec\/artec_leo\//,
  )
  assert.equal(lead.kindLabel, 'Демонстрация')
})
