// Сопоставление заявки с лидом Битрикс24: поля лида (crm.lead.add) и строки товаров
// (crm.lead.productrows.set). Только собирает запросы, сеть не трогает — она в src/lib/crm/bitrix24.ts.

const money = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })

function kzt(value) {
  return `${money.format(BigInt(value))} ₸`
}

/**
 * Откуда заявка одной строкой: кнопка, товар, раздел, сценарий. Идёт в «Дополнительно об
 * источнике» (SOURCE_DESCRIPTION) и в комментарий — по ней потом делается анализ сделок.
 */
export function sourceLine(lead) {
  const source = lead.source
  if (!source) return ''
  return [
    source.button && `Кнопка: ${source.button}`,
    source.product && `Товар: ${source.product}`,
    source.section && `Раздел: ${source.section}`,
    source.scenario && `Сценарий: ${source.scenario}`,
    source.page && `Страница: ${source.page}`,
  ]
    .filter(Boolean)
    .join('; ')
}

/** Состав заявки текстом для комментария лида: менеджер видит всё, не открывая CMS. */
function describe(lead) {
  const rows = lead.items.map((item) => {
    const options = [item.configuration, item.license].filter((v) => v && v !== '—').join(', ')
    const where = [item.section, item.scenario].filter(Boolean).join(', ')
    const what = `${options ? `${item.title}, ${options}` : item.title}${where ? ` [${where}]` : ''}`
    if (!item.unitKzt) return `${what}: ${item.quantity} шт., цена по запросу`
    return `${what}: ${item.quantity} шт. × ${kzt(item.unitKzt)} = ${kzt(item.totalKzt)}`
  })
  const head = lead.kindLabel
    ? [`${lead.kindLabel}. Страница: ${lead.pageTitle}. Клиент просит перезвонить.`, '']
    : []
  const total = BigInt(lead.totalKzt || '0') > 0n ? [`Итого с НДС: ${kzt(lead.totalKzt)}`] : []
  const parts = [...head, ...rows, ...total]
  if (lead.buyer.type === 'company' && lead.buyer.bin) parts.push(`БИН: ${lead.buyer.bin}`)
  if (lead.comment) parts.push(`Комментарий покупателя: ${lead.comment}`)
  const source = sourceLine(lead)
  if (source) parts.push(`Источник: ${source}`)
  if (lead.messages.length) {
    parts.push('', 'Диалог с консультантом на сайте:')
    for (const message of lead.messages) {
      const who = message.role === 'user' ? 'Клиент' : 'Консультант'
      parts.push(`${who}: ${message.content}`)
    }
  }
  return parts.join('\n')
}

/** Метка заявок с демоверсии: менеджер сразу видит, что это проверка, а не клиент. */
export const TEST_MARK = 'ТЕСТ сайта'

/** Откуда пришёл лид: по этой паре при неясном ответе ищем уже созданный лид, а не создаём второй. */
export const ORIGINATOR = 'cad.kz'

/**
 * @param {object} lead Данные из toCrmLead.
 * @param {{ test?: boolean, responsibleId?: string }} [options] test — пометить лид как проверку
 *   (демоверсия сайта); responsibleId — ID пользователя Битрикс24, на которого ставить лид.
 */
export function toBitrix24Lead(lead, options = {}) {
  const title = lead.kindLabel
    ? `${lead.kindLabel}: ${lead.pageTitle} (${lead.orderNumber})`
    : `Заявка с сайта ${lead.orderNumber}`
  return {
    method: 'crm.lead.add',
    params: {
      fields: {
        TITLE: options.test ? `${TEST_MARK} · ${title}` : title,
        NAME: lead.contact.name,
        COMPANY_TITLE: lead.buyer.type === 'company' ? lead.buyer.companyName : undefined,
        PHONE: lead.contact.phone ? [{ VALUE: lead.contact.phone, VALUE_TYPE: 'WORK' }] : undefined,
        EMAIL: lead.contact.email ? [{ VALUE: lead.contact.email, VALUE_TYPE: 'WORK' }] : undefined,
        OPPORTUNITY: BigInt(lead.totalKzt || '0') > 0n ? lead.totalKzt : undefined,
        CURRENCY_ID: 'KZT',
        COMMENTS: describe(lead),
        SOURCE_ID: 'WEB',
        SOURCE_DESCRIPTION: sourceLine(lead) || undefined,
        ORIGINATOR_ID: ORIGINATOR,
        ORIGIN_ID: lead.idempotencyKey,
        ASSIGNED_BY_ID: options.responsibleId || undefined,
      },
      params: { REGISTER_SONET_EVENT: 'N' },
    },
  }
}

const NAME_LIMIT = 255

/**
 * Строки товаров лида: название с комплектацией и лицензией, цена за единицу с НДС, количество.
 * Товары не привязываются к каталогу Битрикс24 (PRODUCT_ID 0): каталоги сайта и портала разные,
 * а менеджеру нужно видеть ровно то, что выбрал клиент. Без цены (заявка без корзины) — 0.
 */
export function toBitrix24Rows(lead) {
  return lead.items.map((item) => {
    const options = [item.configuration, item.license].filter((v) => v && v !== '—')
    const name = [item.title, ...options].join(', ')
    return {
      PRODUCT_ID: 0,
      PRODUCT_NAME: name.length > NAME_LIMIT ? `${name.slice(0, NAME_LIMIT - 1)}…` : name,
      PRICE: item.unitKzt || '0',
      QUANTITY: item.quantity,
      MEASURE_CODE: 796,
      MEASURE_NAME: 'шт',
    }
  })
}

/** Поиск лида по ключу заявки (crm.lead.list): сверка после обрыва связи и защита от дублей. */
export function findLeadQuery(idempotencyKey) {
  return {
    filter: { ORIGINATOR_ID: ORIGINATOR, ORIGIN_ID: idempotencyKey },
    select: ['ID', 'ORIGINATOR_ID', 'ORIGIN_ID'],
    order: { ID: 'DESC' },
  }
}

/**
 * ID лида из ответа поиска — только если ключ совпал. Если портал не умеет фильтровать по ключу
 * и вернёт все лиды подряд, чужой лид не будет принят за наш.
 */
export function pickFoundLead(result, idempotencyKey) {
  if (!Array.isArray(result)) return null
  const found = result.find(
    (row) => row?.ORIGINATOR_ID === ORIGINATOR && row?.ORIGIN_ID === idempotencyKey,
  )
  return found?.ID ? String(found.ID) : null
}
