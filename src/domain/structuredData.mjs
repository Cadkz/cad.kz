/**
 * Разметка schema.org (JSON-LD) для поисковиков (решение владельца 20.10.2026): по ней Google
 * и Яндекс показывают в выдаче цену товара, хлебные крошки, дату новости, карточку компании.
 * Только данные, которые видны на странице: цена — та же, что в каталоге и на товаре; рейтинга
 * и отзывов нет (на сайте их нет — выдумывать нельзя); наличие не указываем — сайт его не знает.
 * Все адреса — полные (`base` — адрес сайта без слеша в конце).
 */

const CONTEXT = 'https://schema.org'

/** Полный адрес из относительного; уже полный и пустой — как есть. */
export function absoluteUrl(base, href) {
  if (!href) return undefined
  if (/^https?:\/\//.test(href)) return href
  return `${base}${href.startsWith('/') ? '' : '/'}${href}`
}

/** Убрать пустые поля, чтобы в разметке не было null и пустых строк. */
function compact(object) {
  return Object.fromEntries(
    Object.entries(object).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== '' &&
        !(Array.isArray(value) && value.length === 0),
    ),
  )
}

const DAYS = {
  пн: 'Monday',
  вт: 'Tuesday',
  ср: 'Wednesday',
  чт: 'Thursday',
  пт: 'Friday',
  сб: 'Saturday',
  вс: 'Sunday',
}
const ORDER = Object.keys(DAYS)
const DAY = '(пн|вт|ср|чт|пт|сб|вс)[а-я]*\\.?'
const TIME = '(\\d{1,2})(?:[:.](\\d{2}))?'
const SPAN = `(?:с\\s*)?${TIME}\\s*(?:[–—-]|до)\\s*${TIME}`
const PART = new RegExp(`^${DAY}(?:\\s*[–—-]\\s*${DAY})?[\\s,:]*${SPAN}$`)
const BREAK = new RegExp(`[,;]?\\s*(?:перерыв|обед)[\\s:]*${SPAN}`)

const hhmm = (h, m) => `${h.padStart(2, '0')}:${m ?? '00'}`

/**
 * Часы работы из настройки «Часы работы» («Пн–Пт 9:00–18:00», «пн-пт с 09:00 до 18:00,
 * сб 10:00–14:00», «…, перерыв 13:00–14:00») → openingHoursSpecification; перерыв делит день
 * на две части. Что-то не разобрали — null: лучше без часов, чем с неверными.
 */
export function parseHours(text) {
  let clean = (text ?? '').toLowerCase().replace(/\s+/g, ' ').trim()
  if (!clean) return null
  const pause = BREAK.exec(clean)
  if (pause) clean = clean.replace(pause[0], '').trim()
  const pauseFrom = pause ? hhmm(pause[1], pause[2]) : null
  const pauseTo = pause ? hhmm(pause[3], pause[4]) : null
  const result = []
  for (const part of clean.split(/[;,]\s*(?=[а-я])/)) {
    const match = PART.exec(part.trim())
    if (!match) return null
    const [, from, to, h1, m1, h2, m2] = match
    const start = ORDER.indexOf(from)
    const end = to ? ORDER.indexOf(to) : start
    if (end < start) return null
    const days = ORDER.slice(start, end + 1).map((day) => DAYS[day])
    const opens = hhmm(h1, m1)
    const closes = hhmm(h2, m2)
    const spans =
      pauseFrom && pauseTo && opens < pauseFrom && pauseTo < closes
        ? [
            [opens, pauseFrom],
            [pauseTo, closes],
          ]
        : [[opens, closes]]
    for (const [from, to] of spans)
      result.push({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: days,
        opens: from,
        closes: to,
      })
  }
  return result.length ? result : null
}

/** Ссылка на компанию из других разметок (продавец товара, издатель новости). */
export const organizationRef = (base) => ({ '@id': `${base}/#organization` })

/**
 * Компания: на каждой странице. С адресом — магазин (Store, вид LocalBusiness: по нему
 * карточка компании на картах и в выдаче), без адреса — просто организация.
 */
export function organizationLd({ base, name, logo, description, contacts }) {
  const hours = parseHours(contacts.hours)
  const address = contacts.address?.replace(/\s+/g, ' ').trim()
  return compact({
    '@context': CONTEXT,
    '@type': address ? 'Store' : 'Organization',
    '@id': organizationRef(base)['@id'],
    name,
    url: `${base}/`,
    logo: absoluteUrl(base, logo),
    image: address ? absoluteUrl(base, logo) : undefined,
    description,
    email: contacts.email ?? undefined,
    telephone: contacts.phones[0]?.tel,
    address: address
      ? { '@type': 'PostalAddress', streetAddress: address, addressCountry: 'KZ' }
      : undefined,
    openingHoursSpecification: address && hours ? hours : undefined,
    contactPoint: contacts.phones.map((phone) => ({
      '@type': 'ContactPoint',
      telephone: phone.tel,
      contactType: 'sales',
      areaServed: 'KZ',
      availableLanguage: ['ru', 'kk'],
    })),
    // Профили компании; ссылка WhatsApp — не профиль, её нет.
    sameAs: [...contacts.socials.map((social) => social.url), contacts.telegramHref].filter(
      (url, i, all) => url && all.indexOf(url) === i,
    ),
  })
}

/** Сайт: название в выдаче («CAD.kz» вместо адреса). */
export function websiteLd({ base, name }) {
  return {
    '@context': CONTEXT,
    '@type': 'WebSite',
    '@id': `${base}/#website`,
    name,
    url: `${base}/`,
    inLanguage: 'ru-KZ',
    publisher: organizationRef(base),
  }
}

/** Хлебные крошки: последний пункт — текущая страница, без адреса. */
export function breadcrumbLd({ base, items }) {
  if (items.length < 2) return null
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) =>
      compact({
        '@type': 'ListItem',
        position: i + 1,
        name: item.title,
        item: absoluteUrl(base, item.href),
      }),
    ),
  }
}

/** Целые тенге из строки витрины «1 089 262 ₸» → «1089262»; нет цены — null. */
export function kztAmount(formatted) {
  const digits = (formatted ?? '').replace(/\D/g, '')
  return digits ? digits : null
}

/**
 * Товар. Цена — «от» из каталога (самый дешёвый комплект, который можно собрать на странице):
 * несколько комплектаций — AggregateOffer с нижней ценой, одна — Offer. «Цена по запросу» —
 * без предложения: товар описан, цены в выдаче нет.
 */
export function productLd({
  base,
  path,
  title,
  description,
  images,
  vendor,
  category,
  priceFrom,
  offersCount,
}) {
  const price = kztAmount(priceFrom)
  const url = absoluteUrl(base, path)
  const offer = price
    ? offersCount > 1
      ? {
          '@type': 'AggregateOffer',
          priceCurrency: 'KZT',
          lowPrice: price,
          offerCount: offersCount,
          url,
          seller: organizationRef(base),
        }
      : {
          '@type': 'Offer',
          priceCurrency: 'KZT',
          price,
          url,
          seller: organizationRef(base),
        }
    : undefined
  return compact({
    '@context': CONTEXT,
    '@type': 'Product',
    name: title,
    description,
    url,
    image: images.map((image) => absoluteUrl(base, image)),
    brand: vendor ? { '@type': 'Brand', name: vendor } : undefined,
    category,
    offers: offer,
  })
}

/** Новость, статья или акция. */
export function articleLd({ base, path, title, description, image, publishedAt, updatedAt, kind }) {
  return compact({
    '@context': CONTEXT,
    '@type': kind === 'article' ? 'Article' : 'NewsArticle',
    headline: title.length > 110 ? `${title.slice(0, 109)}…` : title,
    description,
    url: absoluteUrl(base, path),
    mainEntityOfPage: absoluteUrl(base, path),
    image: image ? [absoluteUrl(base, image)] : undefined,
    datePublished: publishedAt ?? undefined,
    dateModified: updatedAt ?? publishedAt ?? undefined,
    inLanguage: 'ru-KZ',
    author: { '@type': 'Organization', name: 'Редакция CAD.kz', url: `${base}/` },
    publisher: organizationRef(base),
  })
}

/** Частые вопросы (главная, товар). Вопросы без ответа не выводим. */
export function faqLd(items) {
  const answered = items.filter((item) => item.question.trim() && item.answer.trim())
  if (!answered.length) return null
  return {
    '@context': CONTEXT,
    '@type': 'FAQPage',
    mainEntity: answered.map((item) => ({
      '@type': 'Question',
      name: item.question.trim(),
      acceptedAnswer: { '@type': 'Answer', text: item.answer.trim() },
    })),
  }
}

/**
 * Текст для <script type="application/ld+json">: «<» заменён на <, чтобы «</script>»
 * из текста новости не закрыл тег (рекомендация Next.js).
 */
export function jsonLdText(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
