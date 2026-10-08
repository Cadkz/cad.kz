import { PublicationIndex } from '@/components/PublicationIndex/PublicationIndex'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export const metadata = { title: 'Новости и акции — CAD.kz' }

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
