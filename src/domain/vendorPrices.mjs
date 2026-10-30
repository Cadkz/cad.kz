// @ts-check
// Цены товаров Autodesk на сайте из прайс-листа Autodesk (просьба владельца 30.10.2026: «на всё
// активное в каталоге опубликовать цены»). Прайс-лист приходит раз в месяц и загружается в админке
// «Прайс и база Кадди»; вместе со списком для Кадди сайт обновляет цены предложений по РЦКП —
// рекомендованной цене для конечного покупателя в тенге с НДС (совпадает с прайсом CAD.kz: AutoCAD
// 1 089 262 ₸ и там, и там). Цены в репозиторий не кладутся: только соответствие товаров и строк.
// Чистые функции без базы.

/** Сроки новой подписки, которые продаём на сайте. Те же значения, что в переключателе подбора. */
export const TERMS = /** @type {const} */ (['1 год', '3 года'])

/**
 * Товар сайта (адрес) → продукт в прайс-листе (название без года, «CLOUD», «IC», «AD»).
 * Нет в списке — цена на сайте не меняется: Robot Structural Analysis, Forma Building Design и
 * Revit LT отдельно в прайс-листе не продаются (только в коллекциях или LT Suite) — по запросу.
 * @type {{ slug: string, name: string }[]}
 */
export const AUTODESK_SITE_PRICES = [
  {
    slug: 'architecture_engineering_construction_collection-1107088405',
    name: 'Architecture Engineering & Construction Collection',
  },
  {
    slug: 'product_design_manufacturing_collection',
    name: 'Product Design & Manufacturing Collection',
  },
  { slug: 'media_entertainment_collection_ic', name: 'Media & Entertainment Collection' },
  { slug: 'autocad', name: 'AutoCAD - including specialized toolsets' },
  { slug: 'autocad_lt_for_mac', name: 'AutoCAD LT' },
  { slug: 'autocad_revit_lt_suite', name: 'AutoCAD Revit LT Suite' },
  { slug: 'autodesk-revit', name: 'Revit' },
  { slug: 'civil_3d', name: 'Civil 3D' },
  { slug: 'infraworks', name: 'InfraWorks' },
  { slug: 'navisworks', name: 'Navisworks Manage' },
  { slug: 'navisworks_simulate', name: 'Navisworks Simulate' },
  { slug: 'advance_steel', name: 'Advance Steel' },
  { slug: '3ds_max', name: '3ds Max' },
  { slug: 'recap_pro', name: 'ReCap Pro' },
  { slug: 'inventor_professional', name: 'Inventor Professional' },
  { slug: 'fusion_360_cloud', name: 'Fusion' },
  { slug: 'fusion_for_design', name: 'Fusion for Design' },
  { slug: 'fusion_for_manufacturing', name: 'Fusion for Manufacturing' },
  { slug: 'forma_site_design', name: 'Forma Site Design' },
  { slug: 'bim_360_docs', name: 'Forma Data Management - Single User' },
]

/** Товары Autodesk, у которых цена остаётся «по запросу» и почему — для отчёта владельцу. */
export const AUTODESK_NO_PRICE = {
  robot_structural_analysis: 'отдельно не продаётся, только в AEC Collection',
  forma_building_design: 'отдельно не продаётся, только в AEC Collection',
  revit_lt: 'отдельно не продаётся, только в AutoCAD Revit LT Suite',
}

/**
 * Строка новой подписки на одного пользователя: продукт и срок. Остальное (продление, переход,
 * сетевые, учебные, пакеты на 10–1000 мест, NFR) — null.
 * «Revit 2027 Commercial New Single-user ELD Annual Subscription» → Revit, 1 год;
 * «Forma Data Management - Single User CLOUD Commercial New Annual Subscription» → …, 1 год.
 * @param {string} name
 * @returns {{ base: string, term: (typeof TERMS)[number] } | null}
 */
export function newSubscription(name) {
  const match =
    /^(.+?)\s+Commercial New(?:\s+Single-user)?(?:\s+ELD)?\s+(Annual|3-Year) Subscription$/i.exec(
      name.replace(/\s+/g, ' ').trim(),
    )
  if (!match) return null
  const base = (match[1] ?? '')
    .replace(/\s+(CLOUD|SUB|IC|AD)$/i, '')
    .replace(/\s+20\d\d$/, '')
    .trim()
  if (!base || /\b\d+ Subscription\b/i.test(base)) return null
  return { base, term: /annual/i.test(match[2] ?? '') ? '1 год' : '3 года' }
}

/** «1 089 262», «1089262.0», «1 089 262,50» → «1089262» / «1089262.50»; не цена или 0 — null. */
export function rckp(/** @type {string} */ raw) {
  const text = String(raw ?? '')
    .replace(/[\s ₸]/g, '')
    .replace(',', '.')
  const match = /^(\d{1,12})(?:\.(\d{1,2})\d*)?$/.exec(text)
  if (!match) return null
  const whole = (match[1] ?? '').replace(/^0+(?=\d)/, '')
  const fraction = (match[2] ?? '').replace(/0+$/, '')
  if (whole === '0' && !fraction) return null
  return fraction ? `${whole}.${fraction}` : whole
}

/**
 * @typedef {Record<string, Partial<Record<(typeof TERMS)[number], string>>>} VendorPrices
 *   Название продукта → цена по сроку (тенге с НДС, десятичная строка).
 */

/**
 * Цены прайс-листа для товаров сайта: только продукты из AUTODESK_SITE_PRICES.
 * @param {{ name: string, price: string }[]} rows строки с SKU
 * @returns {VendorPrices}
 */
export function autodeskPrices(rows) {
  /** @type {VendorPrices} */
  const prices = {}
  for (const row of rows) {
    const found = newSubscription(row.name)
    const amount = rckp(row.price)
    if (!found || !amount) continue
    const base = found.base.toLowerCase()
    const entry = AUTODESK_SITE_PRICES.find((item) => item.name.toLowerCase() === base)
    if (!entry) continue
    const terms = prices[entry.name] ?? {}
    // Первая строка срока — электронная поставка (ELD) идёт раньше остальных.
    if (!terms[found.term]) terms[found.term] = amount
    prices[entry.name] = terms
  }
  return prices
}

/**
 * Проверка цен из браузера. Возвращает цены или текст ошибки.
 * @param {unknown} raw
 * @returns {VendorPrices | string}
 */
export function validateVendorPrices(raw) {
  if (!raw || typeof raw !== 'object') return {}
  const names = new Set(AUTODESK_SITE_PRICES.map((entry) => entry.name))
  /** @type {VendorPrices} */
  const prices = {}
  for (const [name, value] of Object.entries(raw)) {
    if (!names.has(name)) return `Неизвестный продукт в ценах: ${name.slice(0, 60)}`
    if (!value || typeof value !== 'object') return `Некорректные цены у ${name}`
    /** @type {Partial<Record<(typeof TERMS)[number], string>>} */
    const terms = {}
    for (const [term, amount] of Object.entries(value)) {
      if (!TERMS.includes(/** @type {(typeof TERMS)[number]} */ (term)))
        return `Некорректный срок у ${name}`
      const clean = typeof amount === 'string' ? rckp(amount) : null
      if (!clean) return `Некорректная цена у ${name}`
      terms[/** @type {(typeof TERMS)[number]} */ (term)] = clean
    }
    prices[name] = terms
  }
  return prices
}

/**
 * @typedef {{ id: number, configuration: string, license: string, amount: string, currency: string,
 *   includesVat: boolean, variants: string[] }} SiteOffer
 * @typedef {{ amount: string, currency: 'KZT', includesVat: true, sourceVat: '16', variants: string[] }} PriceData
 * @typedef {{ update: { id: number, term: string, data: PriceData, changed: boolean }[],
 *   create: { term: string, configuration: string, license: string, data: PriceData }[],
 *   untouched: number }} OfferPlan
 */

/** Не новая подписка: продление, переход, обновление, сетевые — цену не трогаем. */
const OTHER = /продл|renew|переход|switch|обновл|сетев|network|multi|учебн|edu/i

/** Срок из названия или условий предложения. */
function termOf(/** @type {SiteOffer} */ offer) {
  const fromVariants = TERMS.find((term) => offer.variants.includes(term))
  if (fromVariants) return fromVariants
  const text = `${offer.configuration} ${offer.license}`
  if (/\b3\s*(года|лет|year)|36\s*мес/i.test(text)) return '3 года'
  if (/\b1\s*(год|year)|\bгод(ов|овая)?\b|12\s*мес|annual/i.test(text)) return '1 год'
  return null
}

/**
 * Какие предложения товара обновить и какие создать, чтобы у него были цены на 1 и 3 года.
 * Предложение со сроком в «Значениях переключателей» или в названии получает цену своего срока.
 * Единственное предложение без срока («Базовая» из Битрикса) становится годовой подпиской.
 * Продления, переходы и прочее не трогаются (untouched).
 * @param {SiteOffer[]} offers опубликованные предложения товара
 * @param {Partial<Record<(typeof TERMS)[number], string>>} prices
 * @returns {OfferPlan}
 */
export function planOffers(offers, prices) {
  /** @type {OfferPlan} */
  const plan = { update: [], create: [], untouched: 0 }
  const used = new Set()
  const plain = offers.filter((offer) => !OTHER.test(`${offer.configuration} ${offer.license}`))
  for (const term of TERMS) {
    const amount = prices[term]
    if (!amount) continue
    /** @type {PriceData} */
    const data = { amount, currency: 'KZT', includesVat: true, sourceVat: '16', variants: [term] }
    let offer = plain.find((item) => !used.has(item.id) && termOf(item) === term)
    if (!offer && term === '1 год') {
      const loose = plain.filter((item) => !used.has(item.id) && termOf(item) === null)
      if (loose.length === 1) offer = loose[0]
    }
    if (offer) {
      used.add(offer.id)
      const changed =
        offer.amount !== amount ||
        offer.currency !== 'KZT' ||
        !offer.includesVat ||
        !offer.variants.includes(term)
      // Свои значения переключателей (редакция) остаются, срок добавляется.
      const variants = [
        ...new Set([
          ...offer.variants.filter(
            (v) => !TERMS.includes(/** @type {(typeof TERMS)[number]} */ (v)),
          ),
          term,
        ]),
      ]
      plan.update.push({ id: offer.id, term, data: { ...data, variants }, changed })
      continue
    }
    plan.create.push({
      term,
      configuration: term === '1 год' ? 'Подписка на 1 год' : 'Подписка на 3 года',
      license: 'Новая подписка, 1 пользователь',
      data,
    })
  }
  plan.untouched = offers.filter((offer) => !used.has(offer.id)).length
  return plan
}
