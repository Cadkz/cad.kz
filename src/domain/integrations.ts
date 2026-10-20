/**
 * Сообщение диалога с ИИ-консультантом в лиде. Сам консультант — src/lib/assistant/ (адаптер модели
 * по MODEL_PROVIDER, инструменты поиска и цены, демо-режим без модели).
 */
export type Message = { role: 'user' | 'assistant'; content: string }
export type CrmLead = {
  idempotencyKey: string
  orderNumber: string
  /** Заявка без корзины (src/domain/siteRequest.mjs): тип, подпись типа и страница. У заказа нет. */
  kind?: string
  kindLabel?: string
  pageTitle?: string
  /**
   * Откуда пришла заявка: нажатая кнопка, товар, его раздел и сценарий покупки. Нужен, чтобы
   * анализ сделок не упирался в тег «Другое» и продления, которые не видно по названию.
   */
  source?: {
    button: string
    product: string | null
    section: string | null
    scenario: string | null
    page: string | null
  }
  contactWay?: 'callback'
  consent: { accepted: true; at: string; version: string }
  contact: { name: string; email?: string; phone?: string }
  buyer: { type: 'individual' } | { type: 'company'; companyName: string; bin: string }
  comment?: string
  /** Что Кадди собрал в чате для менеджера (продукт, задача, сроки) — отдельно от слов клиента. */
  summary?: { title: string; value: string }[]
  items: {
    offerId: string
    title: string
    configuration: string
    license: string
    quantity: number
    /** Пусто — цена по запросу (заявка без корзины). */
    unitKzt: string
    totalKzt: string
    /** Раздел и сценарий покупки товара строки (у заказа из корзины). */
    section?: string
    scenario?: string
  }[]
  totalKzt: string
  messages: Message[]
}
export interface CrmGateway {
  deliver(lead: CrmLead): Promise<{ status: 'not-sent-demo' | 'sent'; externalId?: string }>
  /** Ищет уже созданный лид по ключу заявки. Нужен после неясного итога, чтобы не создать дубль. */
  find?(idempotencyKey: string): Promise<{ externalId: string } | null>
}
/** Без сети и без обещаний: используется, пока реальная интеграция не согласована. */
export const demoCrm: CrmGateway = {
  async deliver() {
    return { status: 'not-sent-demo' }
  },
}
