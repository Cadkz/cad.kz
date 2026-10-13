import { redirect } from 'next/navigation'
import { ArticleBody } from '@/components/ArticleBody/ArticleBody'
import { AskManager } from '@/components/AskManager/AskManager'
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { Container } from '@/components/Container/Container'
import { PageIntro } from '@/components/PageIntro/PageIntro'
import { ReadingLayout } from '@/components/ReadingLayout/ReadingLayout'
import { RelatedList } from '@/components/RelatedList/RelatedList'
import { pagePath } from '@/domain/legacyPages.mjs'
import { parseRequisites } from '@/domain/requisites.mjs'
import { getContacts } from '@/lib/navigation'
import { getInfoLinks, getPage } from '@/lib/pages'
import { cms } from '@/lib/payload'
import { bodyPictures } from '@/lib/pictures'
import { type Block, imageSources, parseBody } from '@/lib/richText'
import { pageMetadata } from '@/lib/seo'

const PRIVACY = pagePath('privacy-policy')

/** Страницы, под текстом которых стоит блок вопросов с Кадди. */
const QUESTIONS: Record<
  string,
  { title: string; phrase: string; message: string; pose: 'greeting' | 'neutral' }
> = {
  howto: {
    title: 'Вопросы по покупке',
    phrase:
      'Не знаете, какую редакцию взять или как оформить счёт на организацию? Спросите — подскажу или позову менеджера.',
    message: 'Здравствуйте! У меня вопрос по покупке.',
    pose: 'greeting',
  },
  delivery: {
    title: 'Вопросы по доставке',
    phrase:
      'Лицензии приходят на почту быстрее любого курьера. Если что-то непонятно со сроками или получением — спросите.',
    message: 'Здравствуйте! У меня вопрос по доставке.',
    pose: 'neutral',
  },
}

/** «Реквизиты»: вступление абзацем и таблица «подпись — значение»; не узнали — обычный текст. */
function requisitesBlocks(body: string | null | undefined, title: string): Block[] {
  const parsed = parseRequisites(body ?? '')
  if (!parsed) return parseBody(body, title)
  return [
    ...(parsed.intro ? [{ type: 'paragraph' as const, text: parsed.intro }] : []),
    { type: 'fields', items: parsed.fields },
  ]
}

/** Метаданные текстовой страницы: перенесённые title и description или название. */
export async function infoPageMetadata(slug: string) {
  const page = await getPage(slug)
  if (!page) return {}
  return pageMetadata({
    seo: page.seo,
    title: `${page.title} — CAD.kz`,
    description: page.lead ?? page.body,
    path: pagePath(slug),
  })
}

/**
 * Текстовая страница («О компании», «Доставка»…) — шаблон «Чтение». Если страницы ещё нет
 * в CMS (не перенесена), временно ведём на «О компании» или на главную, а не в ошибку.
 */
export async function InfoPageView({ slug }: { slug: string }) {
  const page = await getPage(slug)
  if (!page) redirect(slug === 'about' ? '/' : '/about')
  const blocks =
    slug === 'requisites'
      ? requisitesBlocks(page.body, page.title)
      : parseBody(page.body, page.title)
  const questions = QUESTIONS[slug]
  const [links, pictures, contacts] = await Promise.all([
    getInfoLinks(),
    cms().then((payload) => bodyPictures(payload, imageSources(blocks))),
    getContacts(),
  ])
  const crumbs =
    slug === 'about'
      ? [{ title: 'Главная', href: '/' }, { title: page.title }]
      : [
          { title: 'Главная', href: '/' },
          { title: 'О компании', href: '/about' },
          { title: page.title },
        ]
  return (
    <main>
      <Container>
        <Breadcrumbs items={crumbs} />
        <ReadingLayout
          aside={
            // Все пункты всегда по порядку, открытая страница подсвечена (13.10.2026). Карточки
            // контактов нет: телефоны и почта есть в шапке и подвале.
            <RelatedList
              title="О компании"
              current={pagePath(slug)}
              items={[
                ...links.filter((link) => link.href !== PRIVACY),
                {
                  id: 0,
                  href: '/contacts',
                  title: 'Контакты',
                  date: null,
                  topic: null,
                  excerpt: null,
                  cover: null,
                },
                // Политика — последней: служебная страница, ссылку на неё ждут в конце списка.
                ...links.filter((link) => link.href === PRIVACY),
              ]}
            />
          }
        >
          <PageIntro title={page.title} lead={page.lead} />
          <ArticleBody blocks={blocks} pictures={pictures} />
          {questions && <AskManager contacts={contacts} {...questions} />}
        </ReadingLayout>
      </Container>
    </main>
  )
}
