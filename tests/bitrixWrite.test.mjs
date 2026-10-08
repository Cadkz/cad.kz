import assert from 'node:assert/strict'
import test from 'node:test'
import { failureReason, imageUrl, importImages } from '../src/domain/bitrixImages.mjs'
import {
  addResult,
  finishImport,
  missingKeys,
  planImport,
  plannedKeys,
  productSlug,
  startImport,
  writeImport,
  writeOffers,
  writeProducts,
} from '../src/domain/bitrixImport.mjs'
import { readItems, readKeys } from '../src/domain/bitrixImportInput.mjs'
import { htmlToMarkup } from '../src/domain/bitrixText.mjs'
import { parseBody } from '../src/lib/richText.ts'

/** Payload в памяти: только то, чем пользуется импорт. */
function fakePayload(seed = {}) {
  const db = new Map(Object.entries(seed).map(([name, docs]) => [name, structuredClone(docs)]))
  let nextId = 1000
  const table = (name) => {
    if (!db.has(name)) db.set(name, [])
    return db.get(name)
  }
  return {
    db,
    calls: { create: 0, update: 0 },
    async find({ collection, where, sort }) {
      let docs = [...table(collection)]
      const before = where?.effectiveAt?.less_than_equal
      if (before) docs = docs.filter((d) => d.effectiveAt <= before)
      for (const [field, condition] of Object.entries(where ?? {}))
        if (condition.in) docs = docs.filter((d) => condition.in.includes(d[field]))
      if (sort === '-effectiveAt') docs.sort((a, b) => b.effectiveAt.localeCompare(a.effectiveAt))
      return { docs: structuredClone(docs) }
    },
    async create({ collection, data }) {
      this.calls.create++
      const doc = { id: nextId++, ...structuredClone(data) }
      table(collection).push(doc)
      return structuredClone(doc)
    },
    async update({ collection, id, data }) {
      this.calls.update++
      const doc = table(collection).find((d) => d.id === id)
      Object.assign(doc, structuredClone(data))
      return structuredClone(doc)
    },
  }
}

const price = (amount, currency = 'EUR') => ({
  amount,
  currency,
  includesVat: false,
  sourceVat: '16',
})

const catalog = () => ({
  products: [
    {
      legacyKey: 'bitrix:product:1',
      bitrixId: '1',
      title: 'AutoCAD',
      slug: 'autocad',
      kind: 'software',
      manufacturer: 'Autodesk',
      summary: 'САПР',
      description: 'Текст',
      images: ['/upload/a.png', '/upload/b.png'],
      properties: [{ name: 'Артикул', value: 'ACD' }],
      price: null,
    },
    {
      legacyKey: 'bitrix:product:2',
      bitrixId: '2',
      title: 'Плоттер',
      slug: 'plotter',
      kind: 'hardware',
      manufacturer: 'Canon',
      summary: null,
      description: null,
      images: [],
      properties: [],
      price: price('1542800', 'KZT'),
    },
  ],
  offers: [
    {
      legacyKey: 'bitrix:offer:10',
      productLegacyKey: 'bitrix:product:1',
      title: 'AutoCAD 1 год',
      configuration: 'Базовая',
      license: 'локальная лицензия, на 1 год',
      price: price('1743.50', 'USD'),
    },
    {
      legacyKey: 'bitrix:offer:11',
      productLegacyKey: 'bitrix:product:1',
      title: 'AutoCAD без цены',
      configuration: 'Базовая',
      license: 'сетевая',
      price: null,
    },
  ],
})

test('описание из HTML: абзацы, подзаголовки, списки, таблица; без лишних пробелов', () => {
  const markup = htmlToMarkup(
    '<p><b>SCAD</b>&nbsp;Office — <a href="#">комплекс</a>.</p>\n<h3>Возможности</h3>Текст<ul><li>Расчёт</li>\n<li>Проверка</li></ul><table><tr><td>ОС</td><td>Windows</td></tr></table><img src="x.jpg">',
  )
  assert.equal(
    markup,
    'SCAD Office — комплекс.\n\n## Возможности\n\nТекст\n\n- Расчёт\n- Проверка\n\nОС — Windows',
  )
  assert.deepEqual(
    parseBody(markup).map((b) => b.type),
    ['paragraph', 'heading', 'paragraph', 'list', 'paragraph'],
  )
  assert.equal(htmlToMarkup(''), '')
})

test('адрес товара: код Битрикса как есть, иначе безопасный', () => {
  assert.equal(productSlug('scad_office-21', '5'), 'scad_office-21')
  assert.equal(productSlug('ЛИРА САПР', '7'), 'bx-7')
  assert.equal(productSlug('lira sapr', '7'), 'lira-sapr')
})

test('план: только варианты с ценой, простой товар — вариант «Базовая»', () => {
  const plan = planImport(catalog())
  assert.deepEqual(plan.manufacturers, ['Autodesk', 'Canon'])
  assert.deepEqual(
    plan.offers.map((o) => o.legacyKey),
    ['bitrix:offer:10', 'bitrix:product-price:2'],
  )
  const simple = plan.offers[1].data
  assert.equal(simple.configuration, 'Базовая')
  assert.equal(simple.license, '—')
  assert.equal(simple.amount, '1542800')
})

test('запись: создание, повтор без изменений, демо скрыто, курсы, производитель из демо', async () => {
  const payload = fakePayload({
    manufacturers: [{ id: 1, title: 'autodesk', legacyKey: 'demo:manufacturers:autodesk' }],
    products: [{ id: 2, slug: 'autocad', status: 'published', legacyKey: 'demo:products:autocad' }],
    offers: [{ id: 3, product: 2, status: 'published', legacyKey: 'demo:offers:x' }],
    'exchange-rates': [
      { id: 4, currency: 'EUR', kztPerUnit: '550.00', effectiveAt: '2026-10-01T00:00:00.000Z' },
      { id: 5, currency: 'USD', kztPerUnit: '540', effectiveAt: '2026-10-01T00:00:00.000Z' },
    ],
  })
  const now = new Date('2026-10-08T12:00:00.000Z')
  const plan = planImport(catalog())
  const first = await writeImport(payload, plan, { now, hideDemo: true })

  assert.deepEqual(first.products, { created: 2, updated: 0, unchanged: 0, unpublished: 0 })
  assert.deepEqual(first.offers, { created: 2, updated: 0, unchanged: 0, unpublished: 0 })
  assert.deepEqual(first.manufacturers, { created: 1, updated: 0, unchanged: 1, unpublished: 0 })
  assert.equal(first.demoHidden, 1)
  assert.deepEqual(first.issues, [], 'адрес демотовара освобождён, конфликта нет')
  assert.deepEqual(first.rates, [
    { currency: 'USD', from: '540', to: '550' },
    { currency: 'RUB', from: null, to: '6' },
  ])
  const products = payload.db.get('products')
  assert.equal(products.find((p) => p.id === 2).slug, 'demo-autocad')
  assert.equal(products.find((p) => p.id === 2).status, 'draft')
  assert.equal(payload.db.get('offers').find((o) => o.id === 3).status, 'draft')
  const acad = products.find((p) => p.legacyKey === 'bitrix:product:1')
  assert.equal(acad.slug, 'autocad')
  assert.equal(acad.manufacturer, 1, 'производитель из демо не дублируется')

  const writes = payload.calls.create + payload.calls.update
  const second = await writeImport(payload, plan, { now, hideDemo: true })
  assert.equal(payload.calls.create + payload.calls.update, writes, 'повтор ничего не пишет')
  assert.equal(second.products.unchanged, 2)
  assert.equal(second.offers.unchanged, 2)
  assert.deepEqual(second.rates, [])
})

test('запись: изменение цены, пропавшее снимается с публикации, правки редактора сохраняются', async () => {
  const payload = fakePayload()
  await writeImport(payload, planImport(catalog()))
  const products = payload.db.get('products')
  const acad = products.find((p) => p.legacyKey === 'bitrix:product:1')
  acad.sections = [77]
  acad.status = 'draft'

  const changed = catalog()
  changed.offers[0].price = price('1800', 'USD')
  changed.products.pop()
  const result = await writeImport(payload, planImport(changed))
  assert.equal(result.offers.updated, 1)
  assert.equal(result.products.unpublished, 1)
  assert.equal(result.offers.unpublished, 1)
  assert.equal(products.find((p) => p.legacyKey === 'bitrix:product:2').status, 'draft')
  assert.equal(products.length, 2, 'ничего не удалено')
  assert.deepEqual(acad.sections, [77])
  assert.equal(acad.status, 'draft', 'публикацию решает редактор')
  const offer = payload.db.get('offers').find((o) => o.legacyKey === 'bitrix:offer:10')
  assert.equal(offer.amount, '1800')
})

test('запись: занятый адрес получает номер из Битрикса', async () => {
  const payload = fakePayload({ products: [{ id: 1, slug: 'autocad', status: 'published' }] })
  const result = await writeImport(payload, planImport(catalog()))
  assert.deepEqual(
    result.issues.map((i) => `${i.type}:${i.detail}`),
    ['slugTaken:autocad'],
  )
  assert.ok(payload.db.get('products').some((p) => p.slug === 'autocad-1'))
})

test('картинки: по частям, повтор не качает заново, галерея редактора не трогается', async () => {
  const payload = fakePayload()
  const plan = planImport(catalog())
  await writeImport(payload, plan)
  const downloads = []
  const fetch = async (url) => {
    downloads.push(url)
    if (url.endsWith('b.png')) throw new Error('ответ 404')
    return { data: Buffer.from('png'), mimetype: 'image/png' }
  }
  const first = await importImages(payload, plan, { fetch, limit: 1 })
  assert.equal(first.downloaded, 1)
  assert.equal(first.postponed, 1)
  assert.equal(first.products, 0, 'галерея ждёт, пока докачается всё')

  const second = await importImages(payload, plan, { fetch, limit: 10 })
  assert.equal(second.reused, 1)
  assert.equal(second.failed.length, 1)
  assert.equal(second.products, 1)
  assert.deepEqual(downloads, ['https://cad.kz/upload/a.png', 'https://cad.kz/upload/b.png'])
  const acad = payload.db.get('products').find((p) => p.legacyKey === 'bitrix:product:1')
  assert.equal(acad.gallery.length, 1)
  assert.equal(payload.db.get('media')[0].legacyKey, 'bitrix:image:/upload/a.png')

  const third = await importImages(payload, plan, { fetch })
  assert.equal(third.downloaded + third.reused, 0, 'заполненная галерея не трогается')
})

test('запись частями: как за один раз, время вышло — остаток следующим вызовом', async () => {
  const plan = planImport(catalog())
  const whole = fakePayload()
  const once = await writeImport(whole, plan, { now: new Date('2026-10-08T12:00:00Z') })

  const parts = fakePayload()
  const total = await startImport(parts, plan.manufacturers, {
    now: new Date('2026-10-08T12:00:00Z'),
  })
  const late = await writeProducts(parts, plan.products, { deadline: Date.now() - 1 })
  assert.equal(late.processed, 0, 'после отметки времени не пишет ничего')
  for (const product of plan.products)
    addResult(total, (await writeProducts(parts, [product])).result)
  for (const offer of plan.offers) addResult(total, (await writeOffers(parts, [offer])).result)
  addResult(total, await finishImport(parts, plannedKeys(plan)))

  assert.deepEqual(total, once)
  const strip = (docs) => docs.map(({ id: _id, manufacturer: _m, product: _p, ...rest }) => rest)
  assert.deepEqual(strip(parts.db.get('products')), strip(whole.db.get('products')))
  assert.deepEqual(strip(parts.db.get('offers')), strip(whole.db.get('offers')))
})

test('запись частями: повтор той же части ничего не меняет', async () => {
  const plan = planImport(catalog())
  const payload = fakePayload()
  await startImport(payload, plan.manufacturers)
  await writeProducts(payload, plan.products)
  const writes = payload.calls.create + payload.calls.update
  const again = await writeProducts(payload, plan.products)
  assert.equal(again.processed, 2)
  assert.equal(again.result.products.unchanged, 2)
  assert.equal(payload.calls.create + payload.calls.update, writes)
})

test('картинки: только со старого сайта; не скачавшиеся раньше пропускаются', async () => {
  assert.equal(imageUrl('/upload/a.png').toString(), 'https://cad.kz/upload/a.png')
  assert.equal(imageUrl('https://evil.example/a.png'), null)
  assert.equal(imageUrl('//evil.example/a.png'), null)
  assert.equal(imageUrl('upload/a.png'), null)

  const payload = fakePayload()
  const plan = planImport(catalog())
  await writeImport(payload, plan)
  const downloads = []
  const fetch = async (url) => {
    downloads.push(url)
    return { data: Buffer.from('png'), mimetype: 'image/png' }
  }
  const result = await importImages(payload, plan, { fetch, skip: ['/upload/b.png'] })
  assert.deepEqual(downloads, ['https://cad.kz/upload/a.png'])
  assert.equal(result.products, 1, 'галерея из того, что скачалось')
  const late = await importImages(fakePayload(), plan, { fetch, deadline: Date.now() - 1 })
  assert.equal(late.downloaded, 0)
})

test('проверка частей со страницы: принимает план, отклоняет лишнее и чужое', () => {
  const plan = planImport(catalog())
  const products = readItems('product', plan.products, 60)
  assert.deepEqual(products.items, plan.products)
  assert.deepEqual(readItems('offer', plan.offers, 150).items, plan.offers)

  const withExtra = structuredClone(plan.products[0])
  withExtra.data.status = 'published'
  withExtra.data.price = '1'
  assert.deepEqual(Object.keys(readItems('product', [withExtra], 60).items[0].data).sort(), [
    'description',
    'kind',
    'properties',
    'summary',
    'title',
  ])

  const badKey = { ...plan.products[0], legacyKey: 'demo:products:autocad' }
  assert.match(readItems('product', [badKey], 60).error, /Товар №1.*неверный ключ/)
  const badImage = { ...plan.products[0], images: ['http://169.254.169.254/latest'] }
  assert.match(readItems('product', [badImage], 60).error, /не со старого сайта/)
  const badPrice = structuredClone(plan.offers[0])
  badPrice.data.amount = '-5'
  assert.match(readItems('offer', [badPrice], 150).error, /Вариант №1.*цена/)
  const badCurrency = structuredClone(plan.offers[0])
  badCurrency.data.currency = 'GBP'
  assert.match(readItems('offer', [badCurrency], 150).error, /валюта/)
  assert.match(readItems('offer', plan.offers, 1).error, /Слишком большая часть/)
  assert.match(readItems('product', [], 60).error, /Пустая/)
  assert.deepEqual(readKeys(plannedKeys(plan)).items, plannedKeys(plan))
  assert.ok(readKeys(['demo:products:x']).error)
})

test('сверка с базой: находит товары и варианты плана, которых нет в базе', async () => {
  const plan = planImport(catalog())
  const payload = fakePayload()
  assert.deepEqual(await missingKeys(payload, plannedKeys(plan)), plannedKeys(plan))
  await writeImport(payload, plan)
  assert.deepEqual(await missingKeys(payload, plannedKeys(plan)), [])
  payload.db.set(
    'offers',
    payload.db.get('offers').filter((o) => o.legacyKey !== 'bitrix:offer:10'),
  )
  assert.deepEqual(await missingKeys(payload, plannedKeys(plan)), ['bitrix:offer:10'])
})

test('картинки: товара нет в базе — считается отдельно, а не как готовый', async () => {
  const plan = planImport(catalog())
  const result = await importImages(fakePayload(), plan, {
    fetch: async () => ({ data: Buffer.from('png'), mimetype: 'image/png' }),
  })
  assert.equal(result.notInBase, 1)
  assert.equal(result.downloaded, 0)
})

test('картинки: GIF принимается, неподходящий формат и 404 — с понятной причиной', async () => {
  const payload = fakePayload()
  const plan = planImport(catalog())
  await writeImport(payload, plan)
  const fetch = async (url) => {
    if (url.endsWith('a.png')) return { data: Buffer.from('gif'), mimetype: 'image/gif' }
    return { data: Buffer.from('bmp'), mimetype: 'image/bmp' }
  }
  const result = await importImages(payload, plan, { fetch })
  assert.equal(result.downloaded, 1, 'GIF скачан')
  assert.deepEqual(
    result.failed.map((f) => f.reason),
    ['формат image/bmp не принимается в «Медиа»'],
  )
  assert.equal(
    failureReason(new Error('ответ 404')),
    'на старом сайте нет такого файла (ответ 404)',
  )
  assert.equal(failureReason(new Error('ответ 503')), 'старый сайт ответил ошибкой 503')
  const timeout = new Error('timeout')
  timeout.name = 'TimeoutError'
  assert.equal(failureReason(timeout), 'старый сайт не ответил за 30 секунд')
})
