// Черновое сопоставление заявки с полями лида Битрикс24 (метод crm.lead.add).
// Только собирает запрос, сеть не трогает. Окончательный состав полей и воронку согласуем
// отдельно на тестовой воронке, до этого реальные отправки выключены.

const money = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })

function kzt(value) {
  return `${money.format(BigInt(value))} ₸`
}

/** Состав заявки текстом для комментария лида: менеджер видит всё, не открывая CMS. */
function describe(lead) {
  const rows = lead.items.map((item) => {
    const options = [item.configuration, item.license].filter((v) => v && v !== '—').join(', ')
    const what = options ? `${item.title}, ${options}` : item.title
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
  if (lead.messages.length) {
    parts.push('', 'Диалог с консультантом на сайте:')
    for (const message of lead.messages) {
      const who = message.role === 'user' ? 'Клиент' : 'Консультант'
      parts.push(`${who}: ${message.content}`)
    }
  }
  return parts.join('\n')
}

/**
 * @param {object} lead Данные из toCrmLead.
 */
export function toBitrix24Lead(lead) {
  return {
    method: 'crm.lead.add',
    params: {
      fields: {
        TITLE: lead.kindLabel
          ? `${lead.kindLabel}: ${lead.pageTitle} (${lead.orderNumber})`
          : `Заявка с сайта ${lead.orderNumber}`,
        NAME: lead.contact.name,
        COMPANY_TITLE: lead.buyer.type === 'company' ? lead.buyer.companyName : undefined,
        PHONE: lead.contact.phone ? [{ VALUE: lead.contact.phone, VALUE_TYPE: 'WORK' }] : undefined,
        EMAIL: lead.contact.email ? [{ VALUE: lead.contact.email, VALUE_TYPE: 'WORK' }] : undefined,
        OPPORTUNITY: BigInt(lead.totalKzt || '0') > 0n ? lead.totalKzt : undefined,
        CURRENCY_ID: 'KZT',
        COMMENTS: describe(lead),
        SOURCE_ID: 'WEB',
        // По этим двум полям при неясном ответе ищем уже созданный лид, а не создаём второй.
        ORIGINATOR_ID: 'cad.kz',
        ORIGIN_ID: lead.idempotencyKey,
      },
      params: { REGISTER_SONET_EVENT: 'N' },
    },
  }
}
