import type { Metadata } from 'next'
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
import { getNeighbors, getPublication, getPublications, toCard } from '@/lib/publications'
import { parseBody } from '@/lib/richText'

type Props = { params: Promise<{ slug: string }> }

const sections = {
  news: { title: 'Новости', href: '/news' },
  article: { title: 'Статьи', href: '/articles' },
  promotion: { title: 'Акции', href: '/news?kind=promotion' },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const publication = await getPublication((await params).slug)
  return publication
    ? { title: `${publication.title} — CAD.kz`, description: publication.excerpt ?? undefined }
    : {}
}

/** Новость, статья или акция — шаблон «Чтение». */
export default async function PublicationPage({ params }: Props) {
  const publication = await getPublication((await params).slug)
  if (!publication) notFound()
  const [neighbors, latest, home] = await Promise.all([
    getNeighbors(publication),
    getPublications({ kinds: [publication.kind], limit: 4 }),
    getHome(),
  ])
  const blocks = parseBody(publication.body)
  const toc = blocks.flatMap((b) => (b.type === 'heading' ? [{ id: b.id, text: b.text }] : []))
  const section = sections[publication.kind]
  const related = latest.docs
    .filter((doc) => doc.id !== publication.id)
    .slice(0, 3)
    .map(toCard)

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
            {publication.topic && <Badge>{publication.topic}</Badge>}
          </PageIntro>
          <Toc items={toc} collapsed />
          <ArticleBody blocks={blocks} />
          <PrevNext previous={neighbors.previous} next={neighbors.next} />
        </ReadingLayout>
      </Container>
      <CtaBanner cta={home.cta} />
    </main>
  )
}
