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
 * Кнопки итога на странице товара — одно правило на весь сайт (решение владельца 27.10.2026,
 * по образцу прежней карточки): сверху одна синяя кнопка — заявка, рядом маленькая квадратная
 * с корзиной, ниже «Задать вопрос» (открывает чат с Кадди, в PickerSummary — не здесь).
 * - main: цена на сайте есть и корзина возможна — «Купить» (в корзину; решение владельца
 *   30.10.2026: «Запросить цену и счёт» при опубликованной цене убрать). Иначе заявка: «Запросить
 *   цену»; курс — «Записаться на курс», услуга — «Обсудить проект», продление — «Продлить».
 *   Корзины нет у корпоративного ПО, у сканеров с демонстрацией и на странице семейства.
 * - second: не используется (раньше — значок корзины рядом с заявкой).
 * - links: только «Записаться на демонстрацию» у сканеров с демонстрацией.
 * @param {ActionInput} input
 * @returns {ActionSet}
 */
export function scenarioActions(input) {
  if (input.scenario === 'service')
    return {
      main:
        input.kind === 'course'
          ? req('signup', 'Записаться на курс')
          : req('consult', 'Обсудить проект'),
      second: null,
      links: [],
    }
  if (input.scenario === 'renewal')
    return { main: req('renew', input.renewLabel || 'Продлить'), second: null, links: [] }
  const demo = input.scenario === 'equipment' && Boolean(input.demo)
  const cart = input.cart && !input.family && input.scenario !== 'corporate' && !demo
  const kind = input.scenario === 'equipment' ? 'price' : 'quote'
  return {
    main: cart ? { type: 'cart', label: 'Купить' } : req(kind, 'Запросить цену'),
    second: null,
    links: demo ? [req('demo', 'Записаться на демонстрацию')] : [],
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
