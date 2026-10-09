import { redirect } from 'next/navigation'
import { ArticleBody } from '@/components/ArticleBody/ArticleBody'
import { AskManager } from '@/components/AskManager/AskManager'
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { Container } from '@/components/Container/Container'
import { PageIntro } from '@/components/PageIntro/PageIntro'
import { ReadingLayout } from '@/components/ReadingLayout/ReadingLayout'
import { RelatedList } from '@/components/RelatedList/RelatedList'
import { pagePath } from '@/domain/legacyPages.mjs'
import { getContacts } from '@/lib/navigation'
import { getInfoLinks, getPage } from '@/lib/pages'
import { cms } from '@/lib/payload'
import { bodyPictures } from '@/lib/pictures'
import { imageSources, parseBody } from '@/lib/richText'
import { pageMetadata } from '@/lib/seo'

/** Страницы, под текстом которых стоит блок «Задать вопрос менеджеру». */
const QUESTIONS: Record<string, { title: string; message: string }> = {
  howto: { title: 'Вопросы по покупке', message: 'Здравствуйте! У меня вопрос по покупке.' },
  delivery: { title: 'Вопросы по доставке', message: 'Здравствуйте! У меня вопрос по доставке.' },
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
  const blocks = parseBody(page.body)
  const questions = QUESTIONS[slug]
  const [links, pictures, contacts] = await Promise.all([
    getInfoLinks(),
    cms().then((payload) => bodyPictures(payload, imageSources(blocks))),
    questions ? getContacts() : null,
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
        <ReadingLayout>
          <PageIntro title={page.title} lead={page.lead} />
          <ArticleBody blocks={blocks} pictures={pictures} />
          {questions && contacts && <AskManager contacts={contacts} {...questions} />}

          <RelatedList
            title="О компании"
            items={[
              ...links.filter((link) => link.href !== pagePath(slug)),
              {
                id: 0,
                href: '/contacts',
                title: 'Контакты',
                date: null,
                topic: null,
                excerpt: null,
                cover: null,
              },
            ]}
          />
        </ReadingLayout>
      </Container>
    </main>
  )
}
