/** Provider-neutral contract. Tools, not model text, are the source of price. */
export type Message = { role: 'user' | 'assistant'; content: string }
export type ConsultantTools = {
  searchProducts: (task: string) => Promise<{ id: string; title: string }[]>
  getOffers: (productId: string) => Promise<{ id: string; configuration: string }[]>
  quote: (
    offerId: string,
    quantity: number,
  ) => Promise<{ unitKzt: string; totalKzt: string; rule: string }>
}
export interface ConsultantProvider {
  reply(messages: Message[], tools: ConsultantTools, signal: AbortSignal): Promise<Message>
}
export const demoConsultant: ConsultantProvider = {
  async reply() {
    return {
      role: 'assistant',
      content:
        'Демонстрационный режим. Модель ещё не подключена. Выберите направление в каталоге и рассчитайте учебную цену в конфигураторе.',
    }
  },
}
export type CrmLead = {
  idempotencyKey: string
  orderNumber: string
  consent: { accepted: true; at: string; version: string }
  contact: { name: string; email?: string; phone?: string }
  buyer: { type: 'individual' } | { type: 'company'; companyName: string; bin: string }
  comment?: string
  items: { offerId: string; quantity: number; totalKzt: string }[]
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
