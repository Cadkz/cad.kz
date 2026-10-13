import { newsVendor } from '@/domain/newsVendors.mjs'
import {
  getNewsVendors,
  getPublications,
  getTopicCovers,
  getTopics,
  type PromoState,
  type PublicationKind,
  toCard,
} from '@/lib/publications'
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

/**
 * Список материалов — шаблон «Витрина»: карточки по 3 в ряд во всю рамку, фильтры по
 * производителю и теме. У акций — вкладки «Действующие» и «Архивные» (решение владельца
 * 13.10.2026): по умолчанию только действующие.
 */
export async function PublicationIndex({ path, title, lead, kind, params }: Props) {
  const topic = first(params.topic)
  const vendor = newsVendor(first(params.vendor))?.slug ?? null
  const promo: PromoState | null =
    kind === 'promotion' ? (first(params.archive) ? 'archive' : 'current') : null
  const page = Math.max(1, Number(first(params.page)) || 1)
  const [topics, vendors, result, topicCovers] = await Promise.all([
    getTopics([kind]),
    getNewsVendors([kind], promo),
    getPublications({ kinds: [kind], topic, vendor, promo, page, limit: 12 }),
    getTopicCovers(),
  ])
  const query = (values: Record<string, string | null>) => {
    const search = new URLSearchParams()
    if (kind === 'promotion' && path === '/news') search.set('kind', 'promotion')
    if (promo === 'archive') search.set('archive', '1')
    for (const [key, value] of Object.entries(values)) if (value) search.set(key, value)
    const text = search.toString()
    return `${path}${text ? `?${text}` : ''}`
  }
  const promoTabs = [
    { title: 'Действующие', href: `${path}?kind=promotion` },
    { title: 'Архивные', href: `${path}?kind=promotion&archive=1` },
  ]
  const empty =
    promo === 'current'
      ? 'Сейчас действующих акций нет. Загляните в архив или спросите менеджера о скидках.'
      : 'Материалов пока нет. Их добавляет редактор в админке.'

  return (
    <main>
      <Container>
        <Breadcrumbs items={[{ title: 'Главная', href: '/' }, { title }]} />
        <PageIntro title={title} lead={lead}>
          {kind === 'promotion' ? (
            <PublicationTabs
              current={
                promo === 'archive' ? (promoTabs[1]?.href ?? '') : (promoTabs[0]?.href ?? '')
              }
              tabs={promoTabs}
              label="Акции"
            />
          ) : (
            <PublicationTabs current={path} />
          )}
        </PageIntro>
        <div className={styles.filters}>
          <TopicLinks
            topics={vendors}
            active={vendor}
            hrefFor={(slug) => query({ vendor: slug, topic })}
            label="Производитель"
            allLabel="Все"
            min={1}
          />
          <TopicLinks
            topics={topics}
            active={topic}
            hrefFor={(slug) => query({ topic: slug, vendor })}
          />
        </div>
        {result.docs.length ? (
          <Grid as="ul" span={{ base: 12, sm: 6, md: 4 }}>
            {result.docs.map((doc, i) => (
              <li key={doc.id}>
                <NewsCard
                  news={toCard(doc, topicCovers)}
                  tone={tones[i % tones.length]}
                  withExcerpt
                  level={2}
                />
              </li>
            ))}
          </Grid>
        ) : (
          <p className={styles.empty}>{empty}</p>
        )}
        <PageLinks
          page={result.page}
          pages={result.totalPages}
          hrefFor={(n) => query({ topic, vendor, page: n > 1 ? String(n) : null })}
        />
      </Container>
    </main>
  )
}
