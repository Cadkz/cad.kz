import type { HomePage } from '../../payload-types'
import { getContacts } from './navigation'
import { newsHref } from './navigationHrefs'
import { cms } from './payload'
import { toPicture } from './pictures'
import { getPublications } from './publications'

export type HomeLink = { label: string; href: string } | null
export type Slide = { title: string; text: string | null; href: string }

/** Ссылка из CMS. Слово whatsapp в поле ссылки подставляет номер WhatsApp из контактов. */
function resolveLink(
  label: string | null | undefined,
  href: string | null | undefined,
  whatsapp: string | null,
): HomeLink {
  if (!label || !href) return null
  if (href.trim().toLowerCase() === 'whatsapp') return whatsapp ? { label, href: whatsapp } : null
  return { label, href }
}

export async function getHome() {
  const payload = await cms()
  const [page, contacts, promotions] = await Promise.all([
    payload.findGlobal({ slug: 'home-page', depth: 1 }) as Promise<HomePage>,
    getContacts(),
    getPublications({ kinds: ['promotion'], limit: 5 }),
  ])
  const wa = contacts.whatsappHref
  return {
    eyebrow: page.eyebrow ?? null,
    /** Номер WhatsApp из контактов: главная кнопка первого экрана. */
    whatsappHref: wa,
    title: page.title,
    slides: promotions.docs.map(
      (item): Slide => ({
        title: item.title,
        text: item.excerpt ?? null,
        href: newsHref(item.slug),
      }),
    ),
    sideCards: (page.sideCards ?? []).map((card) => ({
      title: card.title,
      text: card.text ?? null,
      dark: Boolean(card.dark),
      link: resolveLink(card.linkLabel, card.linkHref, wa),
    })),
    trust: {
      title: page.trust?.title ?? null,
      lead: page.trust?.lead ?? null,
      partners: (page.trust?.partners ?? []).map((p) => ({
        vendor: p.vendor,
        status: p.status,
        note: p.note ?? null,
        logo: toPicture(p.logo, p.vendor),
        href: p.href ?? null,
      })),
      links: (page.trust?.links ?? []).map((l) => ({ label: l.label, href: l.href })),
    },
    bim: {
      eyebrow: page.bim?.eyebrow ?? null,
      title: page.bim?.title ?? null,
      lead: page.bim?.lead ?? null,
      stages: (page.bim?.stages ?? []).map((s) => ({ title: s.title, text: s.text ?? null })),
      stats: (page.bim?.stats ?? []).map((s) => ({ value: s.value, label: s.label })),
      link: resolveLink(page.bim?.linkLabel, page.bim?.linkHref, wa),
    },
    process: (page.process ?? []).map((s) => ({ title: s.title, text: s.text ?? null })),
    faq: (page.faq ?? []).map((s) => ({ question: s.question, answer: s.answer })),
    cta: {
      title: page.cta?.title ?? null,
      text: page.cta?.text ?? null,
      link: resolveLink(page.cta?.linkLabel, page.cta?.linkHref, wa),
    },
  }
}

export type Home = Awaited<ReturnType<typeof getHome>>
