// Оформление заказа: проверка формы, неизменяемый снимок и данные для CRM.
// Чистые функции без БД, сети и Node-модулей: файл можно подключать и на сервере, и в браузере.
// Деньги считает только pricing.mjs, здесь суммы лишь складываются целыми числами.

import { normalizeCart } from './cart.mjs'

/** Версия текста согласия. Меняется вместе с текстом: в заказе хранится то, что видел покупатель. */
export const CONSENT_VERSION = 'demo-2026-10-08'
export const CONSENT_TEXT =
  'Даю согласие на обработку моих персональных данных для оформления этой заявки.'

/** Версия формата снимка. Увеличивается, если меняется состав полей. */
export const SNAPSHOT_VERSION = 1

export const BUYER_TYPES = /** @type {const} */ (['individual', 'company'])

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Приводит телефон к виду +77011234567 или возвращает null, если номер не похож на телефон. */
export function normalizePhone(value) {
  if (typeof value !== 'string') return null
  const text = value.trim()
  if (!/^[+\d\s().-]+$/.test(text)) return null
  const digits = text.replace(/\D/g, '')
  if (text.startsWith('+')) {
    if (digits.length < 10 || digits.length > 15) return null
    if (digits.startsWith('7') && digits.length !== 11) return null
    return `+${digits}`
  }
  if (digits.length === 11 && (digits.startsWith('8') || digits.startsWith('7')))
    return `+7${digits.slice(1)}`
  if (digits.length === 10) return `+7${digits}`
  return null
}

/** Контрольная цифра БИН/ИИН: взвешенная сумма по модулю 11, при остатке 10 — второй набор весов. */
export function isValidBin(value) {
  if (typeof value !== 'string' || !/^\d{12}$/.test(value)) return false
  const digits = [...value].map(Number)
  let check = digits.slice(0, 11).reduce((sum, digit, i) => sum + digit * (i + 1), 0) % 11
  if (check === 10) {
    check =
      digits.slice(0, 11).reduce((sum, digit, i) => sum + digit * (((i + 2) % 11) + 1), 0) % 11
    if (check === 10) return false
  }
  return check === digits[11]
}

/** Управляющие символы (кроме перевода строки и табуляции) в тексте формы не нужны и опасны для CRM. */
function hasControl(value) {
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0
    if ((code < 32 && code !== 9 && code !== 10) || code === 127) return true
  }
  return false
}

function text(value) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
}

function multiline(value) {
  if (typeof value !== 'string') return ''
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim()
}

function checkItems(input, errors) {
  try {
    const items = normalizeCart(input)
    if (!items.length) errors.items = 'Корзина пуста. Добавьте товар и вернитесь к оформлению.'
    return items
  } catch (error) {
    errors.items = error instanceof Error ? error.message : 'Некорректная корзина'
    return []
  }
}

function checkContact(input, errors) {
  const name = text(input.name)
  if (name.length < 2 || name.length > 100 || hasControl(name))
    errors.name = 'Укажите имя: от 2 до 100 символов'
  const phone = normalizePhone(input.phone)
  if (!phone) errors.phone = 'Укажите телефон, например +7 701 123-45-67'
  // Почта необязательна (решение владельца 10.10.2026: обязательны только имя и телефон).
  const email = text(input.email).toLowerCase()
  if (email && (email.length > 254 || !EMAIL.test(email)))
    errors.email = 'Проверьте почту, например name@company.kz'
  return { name, phone, email }
}

/** Без отметки «Нужен счёт на организацию» покупатель — частное лицо. */
function checkBuyerType(input, errors) {
  if (input.type === undefined || input.type === null || input.type === '') return 'individual'
  const type = BUYER_TYPES.find((candidate) => candidate === input.type)
  if (!type) errors.type = 'Не удалось понять, кто покупает. Обновите страницу.'
  return type
}

function checkCompany(input, errors) {
  const companyName = text(input.companyName)
  if (companyName.length < 2 || companyName.length > 200 || hasControl(companyName))
    errors.companyName = 'Укажите название организации'
  // БИН необязателен: менеджер уточнит при подготовке счёта. Введённый — проверяется.
  const bin = text(input.bin).replace(/\s/g, '')
  if (bin && !/^\d{12}$/.test(bin)) errors.bin = 'БИН состоит из 12 цифр. Для ИП укажите ИИН'
  else if (bin && !isValidBin(bin)) errors.bin = 'БИН не прошёл проверку. Проверьте цифры'
  return { companyName, bin }
}

/** Поля формы: контакты, покупатель, комментарий, согласие. Ключи и корзина проверяются отдельно. */
function checkForm(input, errors) {
  const buyerInput = input.buyer && typeof input.buyer === 'object' ? input.buyer : {}
  const contact = checkContact(buyerInput, errors)
  const type = checkBuyerType(buyerInput, errors)
  const company = type === 'company' ? checkCompany(buyerInput, errors) : null
  const comment = multiline(input.comment)
  if (comment.length > 1000 || hasControl(comment))
    errors.comment = 'Комментарий не длиннее 1000 символов'
  if (input.consent !== true)
    errors.consent = 'Без согласия на обработку данных заявку отправить нельзя'
  return { buyer: type ? { ...contact, type, ...(company ?? {}) } : null, comment }
}

/**
 * Проверка только полей формы (без корзины и ключа): мгновенные подсказки в браузере.
 * Те же правила, что и на сервере, потому что это тот же код.
 * @returns {{ ok: true, value: { buyer: CheckoutRequest['buyer'], comment: string } } | { ok: false, errors: Record<string, string> }}
 */
export function validateForm(raw) {
  /** @type {Record<string, string>} */
  const errors = {}
  const { buyer, comment } = checkForm(raw && typeof raw === 'object' ? raw : {}, errors)
  if (Object.keys(errors).length || !buyer) return { ok: false, errors }
  return { ok: true, value: { buyer, comment } }
}

/**
 * Полная проверка запроса на оформление: форма, ключ повтора, корзина, ожидаемая сумма.
 * Возвращает нормализованное значение либо ошибки по полям.
 * @returns {{ ok: true, value: CheckoutRequest } | { ok: false, errors: Record<string, string> }}
 */
export function validateCheckout(raw) {
  const input = raw && typeof raw === 'object' ? raw : {}
  /** @type {Record<string, string>} */
  const errors = {}

  const idempotencyKey = typeof input.idempotencyKey === 'string' ? input.idempotencyKey : ''
  if (!UUID.test(idempotencyKey))
    errors.idempotencyKey = 'Не удалось подготовить форму. Обновите страницу и попробуйте ещё раз.'
  const expectedTotalKzt = typeof input.expectedTotalKzt === 'string' ? input.expectedTotalKzt : ''
  if (!/^\d{1,15}$/.test(expectedTotalKzt))
    errors.expectedTotalKzt = 'Не удалось сверить сумму. Обновите страницу.'
  const items = checkItems(input.items, errors)
  const { buyer, comment } = checkForm(input, errors)

  if (Object.keys(errors).length || !buyer) return { ok: false, errors }
  return {
    ok: true,
    value: {
      idempotencyKey: idempotencyKey.toLowerCase(),
      items,
      expectedTotalKzt,
      buyer,
      comment,
    },
  }
}

/**
 * Строка, по которой узнаём ту же самую заявку: тот же ключ и те же данные — повтор,
 * тот же ключ и другие данные — конфликт. Ожидаемая сумма не входит: она может меняться.
 */
export function canonicalRequest({ buyer, items, comment }) {
  return JSON.stringify({
    buyer: [
      buyer.type,
      buyer.name,
      buyer.phone,
      buyer.email,
      buyer.companyName ?? '',
      buyer.bin ?? '',
    ],
    items: [...items]
      .sort((a, b) => (a.offerId < b.offerId ? -1 : 1))
      .map((item) => [item.offerId, item.quantity]),
    comment,
  })
}

function freeze(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child)
    Object.freeze(value)
  }
  return value
}

/**
 * Неизменяемый снимок заказа. Берёт уже рассчитанные сервером строки корзины и ничего не пересчитывает:
 * исходная цена и валюта, курс и его дата, ставки НДС, итог за единицу и за строку, версия правила.
 * @returns {OrderSnapshot}
 */
export function buildOrderSnapshot({ lines, quotedAt }) {
  if (!Array.isArray(lines) || !lines.length) throw new Error('В заказе нет строк')
  const rules = new Set(lines.map((line) => line.rule))
  const vats = new Set(lines.map((line) => line.targetVat))
  if (rules.size !== 1 || vats.size !== 1)
    throw new Error('Строки рассчитаны по разным правилам или ставкам НДС')
  const total = lines.reduce((sum, line) => sum + BigInt(line.totalKzt), 0n)
  const vat = lines.reduce((sum, line) => sum + BigInt(line.vatMinor), 0n)
  return freeze({
    version: SNAPSHOT_VERSION,
    rule: lines[0].rule,
    currency: 'KZT',
    quotedAt,
    targetVat: lines[0].targetVat,
    lines: lines.map((line) => ({
      offerId: line.offerId,
      productSlug: line.productId,
      productTitle: line.title,
      configuration: line.configuration,
      license: line.license ?? '',
      quantity: line.quantity,
      source: {
        amount: line.amount,
        currency: line.sourceCurrency,
        includesVat: line.includesVat,
        vat: line.sourceVat,
      },
      rate: { kztPerUnit: line.rate, date: line.rateDate ?? null },
      unitKzt: line.unitKzt,
      totalKzt: line.totalKzt,
      vatMinor: line.vatMinor,
    })),
    totalKzt: total.toString(),
    vatMinor: vat.toString(),
  })
}

const NUMBER_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const ASTANA_OFFSET_MS = 5 * 60 * 60 * 1000

/** Номер заказа: CAD-20261008-K7M2P. Дата по времени Казахстана, хвост случайный без похожих символов. */
export function makeOrderNumber(now, randomIndex) {
  const date = new Date(now.getTime() + ASTANA_OFFSET_MS).toISOString().slice(0, 10)
  let tail = ''
  for (let i = 0; i < 5; i++) tail += NUMBER_ALPHABET[randomIndex(NUMBER_ALPHABET.length)]
  return `CAD-${date.replaceAll('-', '')}-${tail}`
}

/** Данные для передачи в CRM. Берутся из сохранённого заказа, а не из запроса клиента. */
export function toCrmLead(order) {
  const { buyer } = order
  return {
    idempotencyKey: order.idempotencyKey,
    orderNumber: order.number,
    consent: { accepted: true, at: order.consent.at, version: order.consent.version },
    contact: { name: buyer.name, email: buyer.email, phone: buyer.phone },
    buyer:
      buyer.type === 'company'
        ? { type: 'company', companyName: buyer.companyName, bin: buyer.bin }
        : { type: 'individual' },
    comment: order.comment || undefined,
    // Лид должен быть понятен менеджеру без CMS: названия, комплектация, лицензия и цены.
    items: order.snapshot.lines.map((line) => ({
      offerId: line.offerId,
      title: line.productTitle,
      configuration: line.configuration,
      license: line.license,
      quantity: line.quantity,
      unitKzt: line.unitKzt,
      totalKzt: line.totalKzt,
    })),
    totalKzt: order.snapshot.totalKzt,
    messages: [],
  }
}

/**
 * @typedef {object} CheckoutRequest
 * @property {string} idempotencyKey
 * @property {{ offerId: string, quantity: number }[]} items
 * @property {string} expectedTotalKzt
 * @property {{ name: string, phone: string, email: string, type: 'individual' | 'company', companyName?: string, bin?: string }} buyer
 * @property {string} comment
 */

/**
 * @typedef {object} SnapshotLine
 * @property {string} offerId
 * @property {string} productSlug
 * @property {string} productTitle
 * @property {string} configuration
 * @property {string} license
 * @property {number} quantity
 * @property {{ amount: string, currency: string, includesVat: boolean, vat: string }} source
 * @property {{ kztPerUnit: string, date: string | null }} rate
 * @property {string} unitKzt
 * @property {string} totalKzt
 * @property {string} vatMinor
 *
 * @typedef {object} OrderSnapshot
 * @property {number} version
 * @property {string} rule
 * @property {'KZT'} currency
 * @property {string} quotedAt
 * @property {string} targetVat
 * @property {SnapshotLine[]} lines
 * @property {string} totalKzt
 * @property {string} vatMinor
 */
