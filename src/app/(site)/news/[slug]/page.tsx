import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArticleBody } from '@/components/ArticleBody/ArticleBody'
import { Badge } from '@/components/Badge/Badge'
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { Container } from '@/components/Container/Container'
import { CtaBanner } from '@/components/CtaBanner/CtaBanner'
import { Grid } from '@/components/Grid/Grid'
import { NewsCard } from '@/components/NewsCard/NewsCard'
import { PageIntro } from '@/components/PageIntro/PageIntro'
import { PrevNext } from '@/components/PrevNext/PrevNext'
import { ReadingLayout } from '@/components/ReadingLayout/ReadingLayout'
import { Section } from '@/components/Section/Section'
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

const tones = ['navy', 'graphite', 'deep'] as const

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

/** Новость, статья или акция — шаблон «Чтение»: текст по центру, «Читайте также» под ним. */
export default async function PublicationPage({ params }: Props) {
  const publication = await getPublication((await params).slug)
  if (!publication) notFound()
  const blocks = parseBody(publication.body)
  const theme = themeOf(publication)
  const [neighbors, sameTopic, latest, home, pictures] = await Promise.all([
    getNeighbors(publication),
    theme?.slug
      ? getPublications({ kinds: [publication.kind], topic: theme.slug, limit: 4 })
      : null,
    getPublications({ kinds: [publication.kind], limit: 4 }),
    getHome(),
    cms().then((payload) => bodyPictures(payload, imageSources(blocks))),
  ])
  const toc = blocks.flatMap((b) => (b.type === 'heading' ? [{ id: b.id, text: b.text }] : []))
  const section = sections[publication.kind]
  // «Читайте также»: сначала та же тема, остальное — свежие материалы того же типа.
  const seen = new Set([publication.id])
  const related = [...(sameTopic?.docs ?? []), ...latest.docs]
    .filter((doc) => !seen.has(doc.id) && seen.add(doc.id))
    .slice(0, 3)
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
        <ReadingLayout>
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
          <Toc items={toc} />
          <ArticleBody blocks={blocks} pictures={pictures} />
          <PrevNext previous={neighbors.previous} next={neighbors.next} />
        </ReadingLayout>
      </Container>
      {related.length > 0 && (
        <Section title="Читайте также">
          <Grid as="ul" span={{ base: 12, sm: 6, md: 4 }}>
            {related.map((item, i) => (
              <li key={item.id}>
                <NewsCard news={item} tone={tones[i % tones.length]} />
              </li>
            ))}
          </Grid>
        </Section>
      )}
      <CtaBanner cta={home.cta} />
    </main>
  )
}
