import type { HomePage } from '../../payload-types'
import { getContacts } from './navigation'
import { newsHref } from './navigationHrefs'
import { cms } from './payload'
import { toPicture } from './pictures'
import { excerptOf, getCurrentPromotions } from './publications'

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
    getCurrentPromotions(5),
  ])
  const wa = contacts.whatsappHref
  return {
    eyebrow: page.eyebrow ?? null,
    /** Номер WhatsApp из контактов: запасной путь первого экрана, если Кадди выключен. */
    whatsappHref: wa,
    title: page.title,
    /** Первый экран «Подбор по задаче»: тексты и кнопки задач для Кадди. */
    hero: {
      lead: page.hero?.lead ?? null,
      button: page.hero?.button || 'Подобрать по задаче',
      cardTitle: page.hero?.cardTitle || 'С чего начнём?',
      placeholder: page.hero?.placeholder || 'Опишите задачу',
      tasks: (page.hero?.tasks ?? []).map((task) => ({
        label: task.label,
        question: task.question,
      })),
      note: page.hero?.note ?? null,
    },
    slides: promotions.map(
      (item): Slide => ({
        title: item.title,
        text: excerptOf(item),
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
        status: p.status ?? null,
        note: p.note ?? null,
        logo: toPicture(p.logo, p.vendor),
        href: p.href ?? null,
      })),
      links: (page.trust?.links ?? []).map((l) => ({ label: l.label, href: l.href })),
    },
    popular: {
      title: page.popular?.title || 'Популярные решения',
      lead: page.popular?.lead ?? null,
      items: (page.popular?.items ?? []).map((item) => ({
        key: item.id ?? `${item.title}-${item.href}`,
        productId:
          typeof item.product === 'object' && item.product
            ? item.product.id
            : (item.product ?? null),
        title: item.title ?? null,
        href: item.href ?? null,
      })),
    },
    renew: { title: page.renew?.title ?? null, text: page.renew?.text ?? null },
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
