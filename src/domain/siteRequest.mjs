// @ts-check
// Заявка без корзины: запрос цены, продление, помощь с выбором, КП по семейству,
// «Подобрать решение» с главной (источник home: задача словами, без товара).
// Клиент выбрал «Перезвоните мне» и оставил имя и телефон. Чистые функции без базы:
// проверка формы (та же в браузере и на сервере) и данные для CRM.
// Названия и цены в заявку подставляет сервер из базы по ID, от клиента берутся только ID.

import { CONSENT_TEXT, CONSENT_VERSION, normalizePhone } from './order.mjs'

export { CONSENT_TEXT, CONSENT_VERSION }

export const REQUEST_KINDS = /** @type {const} */ (['price', 'renew', 'help', 'quote'])

/** @typedef {typeof REQUEST_KINDS[number]} RequestKind */

/** @type {Record<RequestKind, string>} */
export const KIND_LABELS = {
  price: 'Запрос цены',
  renew: 'Продление',
  help: 'Помощь с выбором',
  quote: 'Коммерческое предложение',
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_ITEMS = 40

/** @param {unknown} value */
function text(value) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
}

/** @param {string} value */
function hasControl(value) {
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0
    if ((code < 32 && code !== 9 && code !== 10) || code === 127) return true
  }
  return false
}

/** Откуда заявка: со страницы товара или семейства — или с главной («Подобрать решение»). */
export const REQUEST_SOURCES = /** @type {const} */ (['product', 'home'])

/** Задача в заявке с главной: хотя бы пара слов. */
export const TASK_MIN = 5

/**
 * Поля, которые человек заполняет сам: имя, телефон, комментарий, согласие.
 * С главной комментарий — это задача, без неё заявка не уходит.
 * @param {Record<string, unknown>} input
 * @param {Record<string, string>} errors
 * @param {boolean} [taskRequired]
 */
function checkContact(input, errors, taskRequired = false) {
  const name = text(input.name)
  if (name.length < 2 || name.length > 100 || hasControl(name))
    errors.name = 'Укажите имя: от 2 до 100 символов'
  const phone = normalizePhone(input.phone)
  if (!phone) errors.phone = 'Укажите телефон, например +7 701 123-45-67'
  const comment =
    typeof input.comment === 'string' ? input.comment.replace(/\r\n?/g, '\n').trim() : ''
  if (comment.length > 1000 || hasControl(comment))
    errors.comment = 'Комментарий не длиннее 1000 символов'
  else if (taskRequired && comment.length < TASK_MIN)
    errors.comment = 'Опишите задачу хотя бы парой слов'
  if (input.consent !== true)
    errors.consent = 'Без согласия на обработку данных заявку отправить нельзя'
  return { name, phone: phone ?? '', comment }
}

/**
 * Проверка только полей формы — мгновенные подсказки в браузере.
 * @param {unknown} raw
 * @param {{ taskRequired?: boolean }} [options]  taskRequired — форма «Подобрать решение» с главной.
 * @returns {{ ok: true } | { ok: false, errors: Record<string, string> }}
 */
export function validateContact(raw, options = {}) {
  /** @type {Record<string, string>} */
  const errors = {}
  checkContact(
    raw && typeof raw === 'object' ? /** @type {Record<string, unknown>} */ (raw) : {},
    errors,
    options.taskRequired,
  )
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true }
}

/**
 * @typedef {object} RequestItem
 * @property {number} productId
 * @property {string | null} offerId
 *
 * @typedef {object} SiteRequest
 * @property {string} idempotencyKey
 * @property {RequestKind} kind
 * @property {typeof REQUEST_SOURCES[number]} source
 * @property {number | null} pageProductId  Товар, на странице которого заявка (для семейства — любой из списка); с главной — null.
 * @property {string | null} direction  С главной: адрес выбранного направления (необязательно), название подставит сервер.
 * @property {string | null} familySlug
 * @property {RequestItem[]} items
 * @property {number} quantity
 * @property {{ title: string, value: string }[]} choices  Выбор переключателей (срок, редакция); сервер сверяет с подбором товара.
 * @property {string} name
 * @property {string} phone
 * @property {string} comment
 */

/**
 * Полная проверка заявки на сервере.
 * @param {unknown} raw
 * @returns {{ ok: true, value: SiteRequest } | { ok: false, errors: Record<string, string> }}
 */
export function validateRequest(raw) {
  const input = raw && typeof raw === 'object' ? /** @type {Record<string, any>} */ (raw) : {}
  /** @type {Record<string, string>} */
  const errors = {}
  const idempotencyKey = typeof input.idempotencyKey === 'string' ? input.idempotencyKey : ''
  if (!UUID.test(idempotencyKey))
    errors.idempotencyKey = 'Не удалось подготовить форму. Обновите страницу и попробуйте ещё раз.'
  const kind = REQUEST_KINDS.find((k) => k === input.kind)
  if (!kind) errors.kind = 'Некорректный тип заявки'
  const source = input.source === 'home' ? 'home' : 'product'
  // С главной — только «помощь с выбором», без товара и выбранных позиций.
  if (source === 'home' && kind !== 'help') errors.kind = 'Некорректный тип заявки'
  const pageProductId = source === 'home' ? null : Number(input.pageProductId)
  if (pageProductId !== null && (!Number.isSafeInteger(pageProductId) || pageProductId <= 0))
    errors.page = 'Некорректная страница'
  const direction =
    source === 'home' &&
    typeof input.direction === 'string' &&
    /^[a-z0-9-]{1,80}$/.test(input.direction)
      ? input.direction
      : null
  const familySlug =
    typeof input.familySlug === 'string' && /^[a-z0-9-]{1,80}$/.test(input.familySlug)
      ? input.familySlug
      : null
  const quantity = input.quantity == null ? 1 : Number(input.quantity)
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999)
    errors.quantity = 'Количество от 1 до 999'
  /** @type {RequestItem[]} */
  const items = []
  if (!Array.isArray(input.items) || input.items.length > MAX_ITEMS)
    errors.items = 'Некорректный выбор'
  else
    for (const entry of input.items) {
      const productId = Number(entry?.productId)
      const offerId = entry?.offerId == null ? null : String(entry.offerId)
      if (
        !Number.isSafeInteger(productId) ||
        productId <= 0 ||
        (offerId && !/^\d{1,12}$/.test(offerId))
      ) {
        errors.items = 'Некорректный выбор'
        break
      }
      if (!items.some((i) => i.productId === productId && i.offerId === offerId))
        items.push({ productId, offerId })
    }
  /** @type {{ title: string, value: string }[]} */
  const choices = []
  if (input.choices != null) {
    if (!Array.isArray(input.choices) || input.choices.length > 2)
      errors.items = 'Некорректный выбор'
    else
      for (const choice of input.choices) {
        const title = text(choice?.title)
        const value = text(choice?.value)
        if (!title || !value || title.length > 60 || value.length > 60) {
          errors.items = 'Некорректный выбор'
          break
        }
        choices.push({ title, value })
      }
  }
  if (source === 'home' && (items.length || choices.length)) errors.items = 'Некорректный выбор'
  if (kind === 'quote' && !items.length && !errors.items)
    errors.items = 'Отметьте хотя бы одну программу'
  const contact = checkContact(input, errors, source === 'home')
  if (Object.keys(errors).length || !kind) return { ok: false, errors }
  return {
    ok: true,
    value: {
      idempotencyKey: idempotencyKey.toLowerCase(),
      kind,
      source,
      pageProductId,
      direction,
      familySlug: source === 'home' ? null : familySlug,
      items,
      quantity,
      choices,
      ...contact,
    },
  }
}

/** Номер заявки: REQ-20261010-K7M2P. Дата по времени Казахстана. */
export function makeRequestNumber(
  /** @type {Date} */ now,
  /** @type {(max: number) => number} */ randomIndex,
) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const date = new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10)
  let tail = ''
  for (let i = 0; i < 5; i++) tail += alphabet[randomIndex(alphabet.length)]
  return `REQ-${date.replaceAll('-', '')}-${tail}`
}

/**
 * @typedef {object} ResolvedLine
 * @property {string | null} offerId
 * @property {string} title
 * @property {string} configuration
 * @property {string} license
 * @property {number} quantity
 * @property {string | null} unitKzt  null — цена по запросу.
 * @property {string | null} totalKzt
 */

/**
 * Данные для CRM в том же формате, что у заказа (src/domain/integrations.ts, CrmLead),
 * плюс тип заявки. Строки без цены передаются без сумм.
 * @param {{ number: string, idempotencyKey: string, kind: RequestKind, pageTitle: string, choices: { title: string, value: string }[], name: string, phone: string, comment: string, consentAt: string, lines: ResolvedLine[], totalKzt: string | null }} request
 */
export function toCrmRequest(request) {
  return {
    idempotencyKey: request.idempotencyKey,
    orderNumber: request.number,
    kind: request.kind,
    kindLabel: KIND_LABELS[request.kind],
    pageTitle: request.choices.length
      ? `${request.pageTitle} (${request.choices.map((c) => `${c.title}: ${c.value}`).join(', ')})`
      : request.pageTitle,
    contactWay: 'callback',
    consent: { accepted: true, at: request.consentAt, version: CONSENT_VERSION },
    contact: { name: request.name, phone: request.phone },
    buyer: { type: 'individual' },
    comment: request.comment || undefined,
    items: request.lines.map((line) => ({
      offerId: line.offerId ?? '',
      title: line.title,
      configuration: line.configuration,
      license: line.license,
      quantity: line.quantity,
      unitKzt: line.unitKzt ?? '',
      totalKzt: line.totalKzt ?? '',
    })),
    totalKzt: request.totalKzt ?? '0',
    messages: [],
  }
}
