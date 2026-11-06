import type { Metadata } from 'next'
import { PublicationIndex } from '@/components/PublicationIndex/PublicationIndex'
import { getT } from '@/i18n/server'
import { pageMetadata } from '@/lib/seo'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

/** У новостей и акций свои заголовок и канонический адрес: это разные страницы для поиска. */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { kind } = await searchParams
  const t = await getT()
  return kind === 'promotion'
    ? pageMetadata({
        title: t('Акции — CAD.kz'),
        description: t('Действующие акции CAD.kz на программы, оборудование и обучение.'),
        path: '/news?kind=promotion',
      })
    : pageMetadata({
        title: t('Новости — CAD.kz'),
        description: t('Новости, вебинары и мероприятия CAD.kz.'),
        path: '/news',
      })
}

export default async function NewsPage({ searchParams }: Props) {
  const t = await getT()
  const params = await searchParams
  const promotions = params.kind === 'promotion'
  return (
    <PublicationIndex
      path="/news"
      kind={promotions ? 'promotion' : 'news'}
      title={t(promotions ? 'Акции' : 'Новости')}
      lead={
        promotions
          ? t(
              'Скидки и специальные условия на программы, оборудование и обучение. Подробности — у менеджера.',
            )
          : t('Релизы программ, обновления нормативов и практика по BIM и инженерным расчётам.')
      }
      params={params}
    />
  )
}
