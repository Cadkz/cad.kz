import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { CatalogFilter } from '@/components/CatalogFilter/CatalogFilter'
import { Container } from '@/components/Container/Container'
import { PageIntro } from '@/components/PageIntro/PageIntro'
import { getT } from '@/i18n/server'
import { clientItems, getCatalog } from '@/lib/catalog'
import { fromParams } from '@/lib/catalogFilter'
import { getMenuPopular } from '@/lib/menuPopular'
import { CATALOG_PATH } from '@/lib/navigationHrefs'
import { pageMetadata } from '@/lib/seo'
import { catalogLangs } from '@/lib/translations'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

/** Подборки фильтра (?direction=…) — та же страница: канонический адрес один. */
export async function generateMetadata() {
  const t = await getT()
  return pageMetadata({
    title: t('Каталог — CAD.kz'),
    description: t(
      'Программы для проектирования и расчётов, оборудование и обучение: выберите направление и производителя.',
    ),
    path: CATALOG_PATH,
    // Список карточек открываем на языке, когда почти все товары переведены.
    langs: await catalogLangs(),
  })
}

/** Каталог — шаблон «Каталог»: фильтр слева, карточки справа, на телефоне фильтр в панели. */
export default async function CatalogPage({ searchParams }: Props) {
  const t = await getT()
  const [catalog, popular, params] = await Promise.all([
    getCatalog(),
    getMenuPopular(),
    searchParams,
  ])
  const initial = fromParams(params)
  return (
    <main>
      <Container>
        <Breadcrumbs items={[{ title: 'Главная', href: '/' }, { title: 'Каталог' }]} />
        <PageIntro
          title={t('Каталог')}
          lead={t(
            'Выберите направление, затем производителя. Не знаете, что подойдёт, — спросите Кадди или напишите в WhatsApp.',
          )}
        />
        <CatalogFilter
          key={JSON.stringify(initial)}
          items={clientItems([...catalog.items, ...catalog.extras])}
          facets={catalog.facets}
          lines={catalog.lines}
          vendorLogos={catalog.vendorLogos}
          initial={initial}
          popular={popular}
          collapsible
        />
      </Container>
    </main>
  )
}
