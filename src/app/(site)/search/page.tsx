import type { Metadata } from 'next'
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { Container } from '@/components/Container/Container'
import { Col, Grid } from '@/components/Grid/Grid'
import { PageIntro } from '@/components/PageIntro/PageIntro'
import { SearchForm } from '@/components/SearchForm/SearchForm'
import { SearchResults } from '@/components/SearchResults/SearchResults'
import { getContacts } from '@/lib/navigation'
import { searchCatalog } from '@/lib/search'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

/** Результаты поиска не индексируются: у каждого запроса свой адрес, это не страницы для поисковиков. */
export const metadata: Metadata = {
  title: { absolute: 'Поиск — CAD.kz' },
  robots: { index: false, follow: true },
}

/** Поиск по каталогу — шаблон «Каталог» без фильтра: поле сверху, карточки на всю ширину. */
export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams
  const raw = Array.isArray(params.q) ? params.q[0] : params.q
  const query = (raw ?? '').slice(0, 100)
  const [items, contacts] = await Promise.all([searchCatalog(query), getContacts()])
  return (
    <main>
      <Container>
        <Breadcrumbs items={[{ title: 'Главная', href: '/' }, { title: 'Поиск' }]} />
        <PageIntro title="Поиск по каталогу" />
        <Grid>
          <Col span={{ base: 12, md: 8 }}>
            <SearchForm initial={query} />
          </Col>
        </Grid>
        <SearchResults query={query} items={items} whatsappHref={contacts.whatsappHref} />
      </Container>
    </main>
  )
}
