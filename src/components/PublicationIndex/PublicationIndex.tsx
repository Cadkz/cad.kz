import { getPublications, getTopics, type PublicationKind, toCard } from '@/lib/publications'
import { Breadcrumbs } from '../Breadcrumbs/Breadcrumbs'
import { Container } from '../Container/Container'
import { Grid } from '../Grid/Grid'
import { NewsCard } from '../NewsCard/NewsCard'
import { PageIntro } from '../PageIntro/PageIntro'
import { PageLinks } from '../PageLinks/PageLinks'
import { PublicationTabs } from '../PublicationTabs/PublicationTabs'
import { TopicLinks } from '../TopicLinks/TopicLinks'
import styles from './PublicationIndex.module.css'

type Props = {
  path: string
  title: string
  lead: string
  kind: PublicationKind
  params: Record<string, string | string[] | undefined>
}

const tones = ['navy', 'graphite', 'deep'] as const
const first = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? null

/** Список материалов — шаблон «Витрина»: карточки по 3 в ряд во всю рамку, фильтр по тематике. */
export async function PublicationIndex({ path, title, lead, kind, params }: Props) {
  const topic = first(params.topic)
  const page = Math.max(1, Number(first(params.page)) || 1)
  const [topics, result] = await Promise.all([
    getTopics([kind]),
    getPublications({ kinds: [kind], topic, page, limit: 12 }),
  ])
  const query = (values: Record<string, string | null>) => {
    const search = new URLSearchParams()
    if (kind === 'promotion' && path === '/news') search.set('kind', 'promotion')
    for (const [key, value] of Object.entries(values)) if (value) search.set(key, value)
    const text = search.toString()
    return `${path}${text ? `?${text}` : ''}`
  }

  return (
    <main>
      <Container>
        <Breadcrumbs items={[{ title: 'Главная', href: '/' }, { title }]} />
        <PageIntro title={title} lead={lead}>
          {kind !== 'promotion' && <PublicationTabs current={path} />}
        </PageIntro>
        <TopicLinks topics={topics} active={topic} hrefFor={(slug) => query({ topic: slug })} />
        {result.docs.length ? (
          <Grid as="ul" span={{ base: 12, sm: 6, md: 4 }}>
            {result.docs.map((doc, i) => (
              <li key={doc.id}>
                <NewsCard news={toCard(doc)} tone={tones[i % tones.length]} withExcerpt level={2} />
              </li>
            ))}
          </Grid>
        ) : (
          <p className={styles.empty}>Материалов пока нет. Их добавляет редактор в админке.</p>
        )}
        <PageLinks
          page={result.page}
          pages={result.totalPages}
          hrefFor={(n) => query({ topic, page: n > 1 ? String(n) : null })}
        />
      </Container>
    </main>
  )
}
