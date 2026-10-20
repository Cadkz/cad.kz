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

/** Откуда заявка — по-человечески, для комментария: кнопка и страница. */
function whereFrom(lead) {
  const source = lead.source
  if (!source) return ''
  const page = source.page ? `страница ${source.page}` : ''
  return [source.button, page].filter(Boolean).join(', ')
}

/** Строка товара: название с комплектацией, количество и цена. */
function itemLine(item) {
  const options = [item.configuration, item.license].filter((v) => v && v !== '—').join(', ')
  const what = options ? `${item.title}, ${options}` : item.title
  if (!item.unitKzt) return `— ${what}: ${item.quantity} шт., цена по запросу`
  return `— ${what}: ${item.quantity} шт. × ${kzt(item.unitKzt)} = ${kzt(item.totalKzt)}`
}

/**
 * Комментарий лида — короткая выжимка, чтобы менеджер за 10 секунд понял, что нужно: что собрал
 * Кадди, товары, слова клиента, откуда пришла заявка. Переписка целиком — отдельной записью в ленте
 * лида (`dialogText`), чтобы не растягивать карточку.
 */
function describe(lead) {
  const blocks = []
  if (lead.summary?.length)
    blocks.push([
      'Что нужно клиенту (собрал Кадди):',
      ...lead.summary.map((d) => `— ${d.title}: ${d.value}`),
    ])
  if (lead.items.length) {
    const total = BigInt(lead.totalKzt || '0') > 0n ? [`Итого с НДС: ${kzt(lead.totalKzt)}`] : []
    blocks.push(['Товары:', ...lead.items.map(itemLine), ...total])
  }
  const client = []
  if (lead.buyer.type === 'company' && lead.buyer.bin) client.push(`БИН: ${lead.buyer.bin}`)
  if (lead.comment) client.push(`Комментарий клиента: ${lead.comment}`)
  if (client.length) blocks.push(client)
  const footer = []
  const where = whereFrom(lead)
  if (where) footer.push(`Откуда: ${where}`)
  if (lead.kindLabel) footer.push('Клиент ждёт звонка.')
  if (lead.messages.length) footer.push('Переписка с Кадди — в ленте лида справа.')
  if (footer.length) blocks.push(footer)
  return blocks.map((block) => block.join('\n')).join('\n\n')
}

/** Метка записи с перепиской в ленте лида: по ней повтор понимает, что запись уже есть. */
export const DIALOG_MARK = 'Переписка с Кадди на сайте'

/**
 * Переписка для записи в ленте лида (crm.timeline.comment.add), с жирными «Клиент» и «Кадди»
 * (BB-коды ленты Битрикс24). Пусто, если переписки нет.
 */
export function dialogText(lead) {
  if (!lead.messages.length) return ''
  const lines = lead.messages.map((message) => {
    const who =
      message.role === 'user'
        ? 'Клиент'
        : message.role === 'manager'
          ? `Менеджер${message.name ? ` ${message.name}` : ''}`
          : 'Кадди'
    return `[b]${who}:[/b] ${message.content.replaceAll('[', '(').replaceAll(']', ')')}`
  })
  return [`[b]${DIALOG_MARK}[/b]`, '', ...lines].join('\n')
}

/** Метка заявок с демоверсии: менеджер сразу видит, что это проверка, а не клиент. */
export const TEST_MARK = 'ТЕСТ сайта'

/** Откуда пришёл лид: по этой паре при неясном ответе ищем уже созданный лид, а не создаём второй. */
export const ORIGINATOR = 'cad.kz'

const TITLE_LIMIT = 200

/**
 * Название лида, как привыкли менеджеры: что за заявка, откуда и что хотят — видно в списке лидов
 * без открытия карточки. Номер заявки в конце — для поиска. Заказ из корзины: первый товар и
 * «ещё N»; заявка со страницы: тип и страница (товар, семейство, чат с Кадди).
 */
export function leadTitle(lead) {
  let what
  // Из чата с Кадди страница всегда одна, а продукт он собрал сам — он и говорит, что нужно.
  const product = lead.summary
    ?.find((d) => d.title === 'Продукт')
    ?.value.replace(/\s*\([^)]*\)/g, '')
    .trim()
  if (lead.kindLabel && product) what = `${lead.kindLabel} из чата с Кадди: ${product}`
  else if (lead.kindLabel) what = `${lead.kindLabel} с сайта cad.kz: ${lead.pageTitle}`
  else {
    const [first, ...rest] = lead.items
    const more = rest.length ? ` и ещё ${rest.length}` : ''
    what = first ? `Заказ из корзины cad.kz: ${first.title}${more}` : 'Заказ из корзины cad.kz'
  }
  const tail = ` (${lead.orderNumber})`
  const room = TITLE_LIMIT - tail.length
  return `${what.length > room ? `${what.slice(0, room - 1)}…` : what}${tail}`
}

/**
 * @param {object} lead Данные из toCrmLead.
 * @param {{ test?: boolean, responsibleId?: string }} [options] test — пометить лид как проверку
 *   (демоверсия сайта); responsibleId — ID пользователя Битрикс24, на которого ставить лид.
 */
export function toBitrix24Lead(lead, options = {}) {
  const title = leadTitle(lead)
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

const FIELD_TYPES = {
  string: 'строка',
  integer: 'число',
  double: 'число',
  enumeration: 'список',
  boolean: 'да/нет',
  date: 'дата',
  datetime: 'дата и время',
  crm_status: 'справочник',
  url: 'ссылка',
}

/**
 * Поля лида портала строками для админки: свои поля (UF_CRM_…) и обязательные, у списков — варианты.
 * Нужно, чтобы заполнить поля, по которым у компании работают отчёты и роботы.
 * @param {Record<string, any>} fields Ответ crm.lead.fields.
 */
export function describeLeadFields(fields) {
  if (!fields || typeof fields !== 'object') return []
  return Object.entries(fields)
    .filter(([code, field]) => code.startsWith('UF_CRM_') || field?.isRequired)
    .map(([code, field]) => {
      const name = field?.formLabel || field?.listLabel || field?.title || code
      const type = FIELD_TYPES[field?.type] ?? field?.type ?? ''
      const items = Array.isArray(field?.items)
        ? `: ${field.items.map((item) => `${item.ID} = ${item.VALUE}`).join('; ')}`
        : ''
      const required = field?.isRequired ? ', обязательное' : ''
      return `${code} — ${name} (${type}${required})${items}`
    })
}

/** Источники лида портала строками: «ID = название». Ответ crm.status.list для SOURCE. */
export function describeSources(statuses) {
  if (!Array.isArray(statuses)) return []
  return statuses.map((row) => `${row.STATUS_ID} = ${row.NAME}`)
}
