// Черновое сопоставление заявки с полями лида Битрикс24 (метод crm.lead.add).
// Только собирает запрос, сеть не трогает. Окончательный состав полей и воронку согласуем
// отдельно на тестовой воронке, до этого реальные отправки выключены.

const money = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })

function kzt(value) {
  return `${money.format(BigInt(value))} ₸`
}

/** Состав заявки текстом для комментария лида. */
function describe(lead, lines) {
  const rows = lines.map((line) => `${line.title}, ${line.configuration}: ${line.quantity} шт.`)
  const parts = [...rows, `Итого: ${kzt(lead.totalKzt)}`]
  if (lead.buyer.type === 'company') parts.push(`БИН: ${lead.buyer.bin}`)
  if (lead.comment) parts.push(`Комментарий покупателя: ${lead.comment}`)
  return parts.join('\n')
}

/**
 * @param {object} lead Данные из toCrmLead.
 * @param {Array<{ offerId: string, title: string, configuration: string, quantity: number }>} [lines]
 *   Названия строк. Если не переданы, в комментарии остаются только идентификаторы предложений.
 */
export function toBitrix24Lead(lead, lines) {
  const rows =
    lines ?? lead.items.map((item) => ({ ...item, title: item.offerId, configuration: '' }))
  return {
    method: 'crm.lead.add',
    params: {
      fields: {
        TITLE: `Заявка с сайта ${lead.orderNumber}`,
        NAME: lead.contact.name,
        COMPANY_TITLE: lead.buyer.type === 'company' ? lead.buyer.companyName : undefined,
        PHONE: lead.contact.phone ? [{ VALUE: lead.contact.phone, VALUE_TYPE: 'WORK' }] : undefined,
        EMAIL: lead.contact.email ? [{ VALUE: lead.contact.email, VALUE_TYPE: 'WORK' }] : undefined,
        OPPORTUNITY: lead.totalKzt,
        CURRENCY_ID: 'KZT',
        COMMENTS: describe(lead, rows),
        SOURCE_ID: 'WEB',
        // По этим двум полям при неясном ответе ищем уже созданный лид, а не создаём второй.
        ORIGINATOR_ID: 'cad.kz',
        ORIGIN_ID: lead.idempotencyKey,
      },
      params: { REGISTER_SONET_EVENT: 'N' },
    },
  }
}
