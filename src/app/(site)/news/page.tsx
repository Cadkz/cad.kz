import type { Metadata } from 'next'
import { PublicationIndex } from '@/components/PublicationIndex/PublicationIndex'
import { pageMetadata } from '@/lib/seo'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

/** У новостей и акций свои заголовок и канонический адрес: это разные страницы для поиска. */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { kind } = await searchParams
  return kind === 'promotion'
    ? pageMetadata({
        title: 'Акции — CAD.kz',
        description: 'Действующие акции CAD.kz на программы, оборудование и обучение.',
        path: '/news?kind=promotion',
      })
    : pageMetadata({
        title: 'Новости — CAD.kz',
        description: 'Новости, вебинары и мероприятия CAD.kz.',
        path: '/news',
      })
}

export default async function NewsPage({ searchParams }: Props) {
  const params = await searchParams
  const promotions = params.kind === 'promotion'
  return (
    <PublicationIndex
      path="/news"
      kind={promotions ? 'promotion' : 'news'}
      title={promotions ? 'Акции' : 'Новости'}
      lead={
        promotions
          ? 'Действующие предложения на софт, оборудование и обучение. Условия уточняйте у менеджера.'
          : 'Релизы программ, обновления нормативов и практика по BIM и инженерным расчётам.'
      }
      params={params}
    />
  )
}
