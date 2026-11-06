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
