import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { CatalogFilter } from '@/components/CatalogFilter/CatalogFilter'
import { Container } from '@/components/Container/Container'
import { PageIntro } from '@/components/PageIntro/PageIntro'
import { getCatalog } from '@/lib/catalog'
import { fromParams } from '@/lib/catalogFilter'
import { CATALOG_PATH } from '@/lib/navigationHrefs'
import { pageMetadata } from '@/lib/seo'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

/** Подборки фильтра (?direction=…) — та же страница: канонический адрес один. */
export const metadata = pageMetadata({
  title: 'Каталог — CAD.kz',
  description:
    'Программы для проектирования и расчётов, оборудование и обучение: выберите направление и производителя.',
  path: CATALOG_PATH,
})

/** Каталог — шаблон «Каталог»: фильтр слева, карточки справа, на телефоне фильтр в панели. */
export default async function CatalogPage({ searchParams }: Props) {
  const [catalog, params] = await Promise.all([getCatalog(), searchParams])
  const initial = fromParams(params)
  return (
    <main>
      <Container>
        <Breadcrumbs items={[{ title: 'Главная', href: '/' }, { title: 'Каталог' }]} />
        <PageIntro
          title="Каталог"
          lead="Выберите направление, затем производителя. Не знаете, что подойдёт, — напишите задачу менеджеру."
        />
        <CatalogFilter
          key={JSON.stringify(initial)}
          items={catalog.items}
          facets={catalog.facets}
          lines={catalog.lines}
          initial={initial}
        />
      </Container>
    </main>
  )
}
