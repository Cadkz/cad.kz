/** Provider-neutral contract. Tools, not model text, are the source of price. */
export type Message = { role: 'user' | 'assistant'; content: string }
export type ConsultantTools = {
  searchProducts: (task: string) => Promise<{ id: string; title: string }[]>
  getOffers: (productId: string) => Promise<{ id: string; configuration: string }[]>
  quote: (offerId: string, quantity: number) => Promise<{ unitKzt: string; totalKzt: string; rule: string }>
}
export interface ConsultantProvider {
  reply(messages: Message[], tools: ConsultantTools, signal: AbortSignal): Promise<Message>
}
export const demoConsultant: ConsultantProvider = {
  async reply() { return { role: 'assistant', content: 'Демонстрационный режим. Модель ещё не подключена. Выберите направление в каталоге и рассчитайте учебную цену в конфигураторе.' } },
}
export type CrmLead = {
  idempotencyKey: string
  consent: { accepted: true; at: string; version: string }
  contact: { name: string; email?: string; phone?: string }
  items: { offerId: string; quantity: number; totalKzt: string }[]
  messages: Message[]
}
export interface CrmGateway {
  deliver(lead: CrmLead): Promise<{ status: 'not-sent-demo' | 'sent'; externalId?: string }>
}
/** No network call and no success claim. Durable outbox is a separate implementation step. */
export const demoCrm: CrmGateway = { async deliver() { return { status: 'not-sent-demo' } } }
