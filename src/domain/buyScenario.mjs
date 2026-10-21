// @ts-check
/**
 * Сценарий покупки (документ «Каталог CAD.kz: приоритеты по CRM», раздел 7, решение владельца
 * 12.10.2026): от него зависят кнопки на карточке каталога и на странице товара. У раздела —
 * сценарий по умолчанию, у товара можно выбрать свой. Чистые функции без базы.
 */

export const SCENARIOS = /** @type {const} */ ([
  'standard',
  'corporate',
  'equipment',
  'renewal',
  'service',
])

/** @typedef {typeof SCENARIOS[number]} Scenario */

/** Подписи в админке и в заявке для менеджера. */
/** @type {Record<Scenario, string>} */
export const SCENARIO_LABELS = {
  standard: 'Стандартная лицензия',
  corporate: 'Корпоративное ПО',
  equipment: 'Оборудование',
  renewal: 'Продление и обновление',
  service: 'Услуга',
}

/** Какие сценарии подходят типу товара: оборудование — только у техники, услуга — у курсов и услуг. */
/** @type {Record<string, Scenario[]>} */
const FITS = {
  software: ['standard', 'corporate', 'renewal'],
  hardware: ['equipment', 'standard', 'renewal'],
  course: ['service'],
  service: ['service'],
}

/** Сценарий по типу, когда ни у товара, ни у раздела он не выбран. */
/** @type {Record<string, Scenario>} */
const BY_KIND = {
  software: 'standard',
  hardware: 'equipment',
  course: 'service',
  service: 'service',
}

/**
 * Сценарий товара: свой → раздела (если подходит типу) → по типу. Сценарий раздела «Оборудование»
 * программе в этом разделе не подходит (ReCap в «3D-сканировании» — обычная лицензия).
 * @param {{ own?: string | null, section?: string | null, kind?: string | null }} input
 * @returns {Scenario}
 */
export function resolveScenario({ own, section, kind }) {
  const fits = FITS[kind ?? 'software'] ?? FITS.software
  const pick = (/** @type {string | null | undefined} */ value) =>
    SCENARIOS.find((item) => item === value)
  const ownScenario = pick(own)
  if (ownScenario) return ownScenario
  const fromSection = pick(section)
  if (fromSection && fits.includes(fromSection)) return fromSection
  return BY_KIND[kind ?? 'software'] ?? 'standard'
}

/**
 * Действие кнопки: положить выбор в корзину, открыть заявку нужного вида или перейти к блоку
 * страницы (якорь).
 * @typedef {import('./siteRequest.mjs').RequestKind} RequestKind
 * @typedef {{ type: 'cart' } | { type: 'request', kind: RequestKind } | { type: 'anchor', href: string }} ActionTarget
 * @typedef {ActionTarget & { label: string }} Action
 * @typedef {{ main: Action, second: Action | null, links: Action[] }} ActionSet
 */

/**
 * @typedef {object} ActionInput
 * @property {Scenario} scenario
 * @property {boolean} cart  Есть цена и в выборе нет варианта «по запросу»: корзина возможна.
 * @property {string | null | undefined} kind  Тип товара (курс или услуга — разные подписи).
 * @property {boolean} [demo]  У раздела включена «Запись на демонстрацию» (сканеры Artec).
 * @property {string | null} [renewLabel]  Своя подпись продления из админки.
 * @property {boolean} [picks]  Под товаром есть «С этим покупают»: ссылка «Расходники и ПО к нему».
 * @property {boolean} [about]  Есть описание: ссылка «Программа курса».
 * @property {boolean} [family]  Страница семейства: без корзины.
 */

const req = (/** @type {RequestKind} */ kind, /** @type {string} */ label) =>
  /** @type {Action} */ ({ type: 'request', kind, label })

/**
 * Кнопки страницы товара по сценарию: главная, вторая и ссылки ниже. Цены нет — у стандартной
 * лицензии главная «Получить КП» (AutoCAD и Revit по запросу, решение владельца 12.10.2026).
 * @param {ActionInput} input
 * @returns {ActionSet}
 */
export function scenarioActions(input) {
  const cart = input.cart && !input.family
  /** @type {Action} */
  const toCart = { type: 'cart', label: 'В корзину' }
  const help = req('help', 'Помочь с выбором')
  switch (input.scenario) {
    case 'corporate':
      return {
        main: req('help', 'Подобрать решение'),
        second: req('quote', 'Запросить КП'),
        links: [req('consult', 'Консультация специалиста')],
      }
    case 'equipment': {
      const main = input.demo
        ? req('demo', 'Записаться на демонстрацию')
        : cart
          ? toCart
          : req('price', 'Запросить цену')
      const second = input.demo && cart ? toCart : req('help', 'Подобрать оборудование')
      /** @type {Action[]} */
      const links = []
      if (input.demo && cart) links.push(req('help', 'Подобрать оборудование'))
      if (input.picks)
        links.push({ type: 'anchor', href: '#cross-title', label: 'Расходники и программы к нему' })
      return { main, second, links }
    }
    case 'renewal':
      return {
        main: req('renew', input.renewLabel || 'Продлить'),
        second: cart ? toCart : null,
        links: [req('consult', 'Узнать, что входит в обновление')],
      }
    case 'service': {
      const course = input.kind === 'course'
      return {
        main: course ? req('signup', 'Записаться на курс') : req('consult', 'Обсудить проект'),
        second: null,
        links: input.about
          ? [{ type: 'anchor', href: '#about', label: course ? 'Программа курса' : 'Состав работ' }]
          : [],
      }
    }
    default: {
      const renew = req('renew', input.renewLabel || 'Продлить лицензию')
      if (input.family)
        return {
          main: req('quote', 'Получить КП'),
          second: null,
          links: input.renewLabel ? [renew, help] : [help],
        }
      return cart
        ? { main: toCart, second: req('quote', 'Получить КП на организацию'), links: [renew, help] }
        : { main: req('quote', 'Получить КП'), second: null, links: [renew, help] }
    }
  }
}

/**
 * Кнопка карточки в каталоге — одна на карточку (аудит 21.10.2026, Г4): «В корзину» только у
 * стандартной лицензии и оборудования без демонстрации с одной комплектацией с ценой, у всех
 * остальных — «Подробнее» со ссылкой на страницу товара. Подписи по сценарию («Подобрать
 * решение», «Записаться на демо», «Продлить») остаются на странице товара (scenarioActions).
 * @param {{ scenario: Scenario, demo?: boolean, cart: boolean }} input
 * @returns {{ cart: boolean }}
 */
export function cardAction({ scenario, demo, cart }) {
  if (!cart) return { cart: false }
  if (scenario === 'standard') return { cart: true }
  if (scenario === 'equipment') return { cart: !demo }
  return { cart: false }
}
