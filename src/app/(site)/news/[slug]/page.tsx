import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArticleBody } from '@/components/ArticleBody/ArticleBody'
import { Badge } from '@/components/Badge/Badge'
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { Container } from '@/components/Container/Container'
import { CtaBanner } from '@/components/CtaBanner/CtaBanner'
import { PageIntro } from '@/components/PageIntro/PageIntro'
import { PrevNext } from '@/components/PrevNext/PrevNext'
import { ReadingLayout } from '@/components/ReadingLayout/ReadingLayout'
import { RelatedList } from '@/components/RelatedList/RelatedList'
import { Toc } from '@/components/Toc/Toc'
import { formatDate } from '@/lib/format'
import { getHome } from '@/lib/home'
import { newsHref } from '@/lib/navigationHrefs'
import { cms } from '@/lib/payload'
import { bodyPictures, toPicture } from '@/lib/pictures'
import { getNeighbors, getPublication, getPublications, themeOf, toCard } from '@/lib/publications'
import { imageSources, parseBody } from '@/lib/richText'
import { pageMetadata } from '@/lib/seo'

type Props = { params: Promise<{ slug: string }> }

const sections = {
  news: { title: 'Новости', href: '/news' },
  article: { title: 'Статьи', href: '/articles' },
  promotion: { title: 'Акции', href: '/news?kind=promotion' },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const publication = await getPublication((await params).slug)
  if (!publication) return {}
  return pageMetadata({
    seo: publication.seo,
    title: `${publication.title} — CAD.kz`,
    description: publication.excerpt,
    path: newsHref(publication.slug),
    image: toPicture(publication.cover)?.url,
  })
}

/**
 * Новость, статья или акция — шаблон «Чтение»: текст слева, справа липкая колонка
 * с оглавлением и списком «Читайте также».
 */
export default async function PublicationPage({ params }: Props) {
  const publication = await getPublication((await params).slug)
  if (!publication) notFound()
  const blocks = parseBody(publication.body)
  const theme = themeOf(publication)
  const [neighbors, sameTopic, latest, home, pictures] = await Promise.all([
    getNeighbors(publication),
    theme?.slug
      ? getPublications({ kinds: [publication.kind], topic: theme.slug, limit: 6 })
      : null,
    getPublications({ kinds: [publication.kind], limit: 6 }),
    getHome(),
    cms().then((payload) => bodyPictures(payload, imageSources(blocks))),
  ])
  const toc = blocks.flatMap((b) => (b.type === 'heading' ? [{ id: b.id, text: b.text }] : []))
  const section = sections[publication.kind]
  // «Читайте также»: сначала та же тема, остальное — свежие материалы того же типа.
  const seen = new Set([publication.id])
  const related = [...(sameTopic?.docs ?? []), ...latest.docs]
    .filter((doc) => !seen.has(doc.id) && seen.add(doc.id))
    .slice(0, 5)
    .map(toCard)
  const topicHref = (slug: string) =>
    publication.kind === 'article' ? `/articles?topic=${slug}` : `/news?topic=${slug}`

  return (
    <main>
      <Container>
        <Breadcrumbs
          items={[
            { title: 'Главная', href: '/' },
            { title: section.title, href: section.href },
            { title: publication.title },
          ]}
        />
        <ReadingLayout
          aside={
            <>
              <Toc items={toc} />
              <RelatedList title="Читайте также" items={related} />
            </>
          }
        >
          <PageIntro
            title={publication.title}
            lead={publication.excerpt}
            meta={
              publication.publishedAt ? (
                <>
                  <time dateTime={publication.publishedAt}>
                    {formatDate(publication.publishedAt)}
                  </time>
                  <span>Редакция CAD.kz</span>
                </>
              ) : null
            }
          >
            {theme &&
              (theme.slug ? (
                <Link href={topicHref(theme.slug)}>
                  <Badge>{theme.title}</Badge>
                </Link>
              ) : (
                <Badge>{theme.title}</Badge>
              ))}
          </PageIntro>
          <Toc items={toc} collapsed />
          <ArticleBody blocks={blocks} pictures={pictures} />
          <PrevNext previous={neighbors.previous} next={neighbors.next} />
        </ReadingLayout>
      </Container>
      <CtaBanner cta={home.cta} />
    </main>
  )
}
