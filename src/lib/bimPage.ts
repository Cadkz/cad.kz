import { requestLang } from '@/i18n/server'
import type { BimPage } from '../../payload-types'
import { type HomeLink, resolveLink } from './home'
import { getContacts } from './navigation'
import { cms } from './payload'

export type BimBlock = { eyebrow: string | null; title: string | null; text: string[] }
export type BimService = {
  title: string
  problem: string | null
  work: string[]
  result: string | null
}

/** Абзацы: каждая непустая строка поля — отдельный абзац. */
const lines = (text: string | null | undefined) =>
  (text ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

const block = (value: BimPage['intro']): BimBlock => ({
  eyebrow: value?.eyebrow || null,
  title: value?.title || null,
  text: lines(value?.text),
})

/** «Страница BIM» из админки на языке страницы. */
export async function getBimPage() {
  const payload = await cms()
  const [page, contacts] = await Promise.all([
    payload.findGlobal({ slug: 'bim-page', locale: await requestLang(), depth: 0 }),
    getContacts(),
  ])
  const link: HomeLink = resolveLink(page.cta?.linkLabel, page.cta?.linkHref, contacts.whatsappHref)
  return {
    proof: (page.proof ?? []).map(({ title, text }) => ({ title, text: text || null })),
    intro: block(page.intro),
    help: block(page.help),
    servicesTitle: page.servicesTitle || null,
    services: (page.services ?? []).map(
      ({ title, problem, work, result }): BimService => ({
        title,
        problem: problem || null,
        work: lines(work),
        result: result || null,
      }),
    ),
    outcome: block(page.outcome),
    cta: { title: page.cta?.title || null, text: lines(page.cta?.text), link },
  }
}

export type BimPageData = Awaited<ReturnType<typeof getBimPage>>
