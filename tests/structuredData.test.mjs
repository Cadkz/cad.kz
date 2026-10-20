import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  articleLd,
  breadcrumbLd,
  faqLd,
  jsonLdText,
  kztAmount,
  organizationLd,
  parseHours,
  productLd,
} from '../src/domain/structuredData.mjs'

const base = 'https://cad.kz'
const contacts = {
  phones: [{ label: '+7 (7172) 578-028', tel: '+77172578028' }],
  email: 'office@cad.kz',
  socials: [{ network: 'instagram', url: 'https://www.instagram.com/cad.kz_inst' }],
  telegramHref: 'https://t.me/cadkz',
  whatsappHref: 'https://wa.me/77015501893',
  address: 'г. Астана, ул. А. Пушкина, дом 6/1, ВП-1',
  hours: 'Пн–Пт 9:00–18:00',
}

test('часы работы: диапазон дней и время', () => {
  assert.deepEqual(parseHours('Пн–Пт 9:00–18:00'), [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
  ])
})

test('часы работы: «с … до …», несколько частей, один день', () => {
  const hours = parseHours('пн-пт с 09:00 до 18:00, сб 10:00-14:00')
  assert.equal(hours?.length, 2)
  assert.deepEqual(hours?.[1].dayOfWeek, ['Saturday'])
  assert.equal(hours?.[1].closes, '14:00')
})

test('часы работы: перерыв делит день на две части', () => {
  for (const text of ['Пн–Пт 9:00–18:00, перерыв 13:00–14:00', 'пн-пт 9-18, обед с 13 до 14']) {
    const hours = parseHours(text)
    assert.deepEqual(
      hours?.map((h) => [h.opens, h.closes]),
      [
        ['09:00', '13:00'],
        ['14:00', '18:00'],
      ],
      text,
    )
  }
})

test('часы работы: непонятный текст — без часов, а не неверные', () => {
  assert.equal(parseHours('по договорённости'), null)
  assert.equal(parseHours('Пн–Пт 9:00–18:00, без выходных'), null)
  assert.equal(parseHours(''), null)
})

test('компания с адресом — магазин с часами, профили без WhatsApp', () => {
  const ld = organizationLd({ base, name: 'CAD.kz', logo: '/logo.png', contacts })
  assert.equal(ld['@type'], 'Store')
  assert.equal(ld['@id'], 'https://cad.kz/#organization')
  assert.equal(ld.logo, 'https://cad.kz/logo.png')
  assert.equal(ld.address.addressCountry, 'KZ')
  assert.equal(ld.openingHoursSpecification.length, 1)
  assert.deepEqual(ld.sameAs, ['https://www.instagram.com/cad.kz_inst', 'https://t.me/cadkz'])
})

test('компания без адреса — организация без пустых полей', () => {
  const ld = organizationLd({
    base,
    name: 'CAD.kz',
    logo: '/logo.png',
    contacts: { ...contacts, address: null, hours: null, email: null, socials: [] },
  })
  assert.equal(ld['@type'], 'Organization')
  assert.equal('address' in ld, false)
  assert.equal('email' in ld, false)
  assert.equal('openingHoursSpecification' in ld, false)
})

test('хлебные крошки: полные адреса, у последнего пункта адреса нет', () => {
  const ld = breadcrumbLd({
    base,
    items: [{ title: 'Каталог', href: '/catalog' }, { title: 'AutoCAD' }],
  })
  assert.deepEqual(ld?.itemListElement, [
    { '@type': 'ListItem', position: 1, name: 'Каталог', item: 'https://cad.kz/catalog' },
    { '@type': 'ListItem', position: 2, name: 'AutoCAD' },
  ])
  assert.equal(breadcrumbLd({ base, items: [{ title: 'Одна' }] }), null)
})

test('цена витрины в число тенге', () => {
  assert.equal(kztAmount('1 089 262 ₸'), '1089262')
  assert.equal(kztAmount(null), null)
})

test('товар: несколько комплектаций — нижняя цена, одна — цена, по запросу — без цены', () => {
  const common = {
    base,
    path: '/catalog/autodesk/autocad-lt/',
    title: 'AutoCAD LT',
    description: 'Чертежи 2D',
    images: ['/api/media/file/lt.png', 'https://blob.example/lt.png'],
    vendor: 'Autodesk',
    category: 'САПР',
  }
  const many = productLd({ ...common, priceFrom: '313 621 ₸', offersCount: 3 })
  assert.equal(many.offers['@type'], 'AggregateOffer')
  assert.equal(many.offers.lowPrice, '313621')
  assert.equal(many.offers.priceCurrency, 'KZT')
  assert.deepEqual(many.image, [
    'https://cad.kz/api/media/file/lt.png',
    'https://blob.example/lt.png',
  ])
  assert.equal(many.brand.name, 'Autodesk')
  const one = productLd({ ...common, priceFrom: '313 621 ₸', offersCount: 1 })
  assert.equal(one.offers['@type'], 'Offer')
  assert.equal(one.offers.price, '313621')
  const none = productLd({ ...common, priceFrom: null, offersCount: 0 })
  assert.equal('offers' in none, false)
  assert.equal('aggregateRating' in many, false)
})

test('статья и новость', () => {
  const input = {
    base,
    path: '/news/x',
    title: 'Новость',
    description: null,
    image: null,
    publishedAt: '2026-10-01T05:00:00.000Z',
    updatedAt: null,
    kind: 'news',
  }
  const news = articleLd(input)
  assert.equal(news['@type'], 'NewsArticle')
  assert.equal(news.dateModified, '2026-10-01T05:00:00.000Z')
  assert.equal('image' in news, false)
  assert.equal(articleLd({ ...input, kind: 'article' })['@type'], 'Article')
})

test('частые вопросы: без пустых ответов; пусто — нет разметки', () => {
  const ld = faqLd([
    { question: 'Работаете с физлицами?', answer: 'Да.' },
    { question: 'Пустой', answer: ' ' },
  ])
  assert.equal(ld?.mainEntity.length, 1)
  assert.equal(faqLd([]), null)
})

test('текст разметки не закрывает тег script', () => {
  assert.equal(jsonLdText({ a: '</script><b>' }).includes('</script>'), false)
})
