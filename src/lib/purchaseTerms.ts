import type { SiteSetting } from '../../payload-types'
import { cmsData } from './payload'
import { siteCachedByLang } from './siteCache'

export type PurchaseTerm = { title: string; text: string }
export type PurchaseTerms = { software: PurchaseTerm[]; hardware: PurchaseTerm[] }

const toTerms = (rows: { title: string; text: string }[] | null | undefined): PurchaseTerm[] =>
  (rows ?? []).map(({ title, text }) => ({ title, text }))

/** Условия покупки из «Контакты и подвал» — в общем кэше сайта, как контакты. */
export const getPurchaseTerms = siteCachedByLang(
  'purchase-terms',
  async (lang): Promise<PurchaseTerms> => {
    const payload = await cmsData()
    const settings: SiteSetting = await payload.findGlobal({
      slug: 'site-settings',
      locale: lang,
      depth: 0,
    })
    return {
      software: toTerms(settings.purchaseTerms?.software),
      hardware: toTerms(settings.purchaseTerms?.hardware),
    }
  },
)

/** Строка о сроках: заголовок со словом «срок», «поставка» или «доставка» на любом из языков. */
const DELIVERY_TITLE = /срок|постав|достав|мерзім|жеткіз|deliver|lead time/i

/**
 * Срок поставки товара или производителя вместо общего текста в строке о сроках; такой строки
 * нет — первой строкой «Сроки поставки». Без своего срока — общие условия как есть.
 */
export function withDelivery(
  terms: PurchaseTerm[],
  delivery: string | null,
  title: string,
): PurchaseTerm[] {
  if (!delivery) return terms
  const at = terms.findIndex((term) => DELIVERY_TITLE.test(term.title))
  if (at < 0) return [{ title, text: delivery }, ...terms]
  return terms.map((term, index) => (index === at ? { ...term, text: delivery } : term))
}
