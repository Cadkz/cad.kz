import { PublicationIndex } from '@/components/PublicationIndex/PublicationIndex'
import { getT } from '@/i18n/server'
import { pageMetadata } from '@/lib/seo'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata() {
  const t = await getT()
  return pageMetadata({
    title: t('Статьи — CAD.kz'),
    description: t('Статьи CAD.kz о BIM, САПР, расчётах и оборудовании для проектировщиков.'),
    path: '/articles',
  })
}

export default async function ArticlesPage({ searchParams }: Props) {
  const t = await getT()
  return (
    <PublicationIndex
      path="/articles"
      kind="article"
      title={t('Статьи')}
      lead={t(
        'Разборы, инструкции и практика по BIM, инженерным расчётам и проектированию — от специалистов CAD.kz.',
      )}
      params={await searchParams}
    />
  )
}
