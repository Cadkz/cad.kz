import { PublicationIndex } from '@/components/PublicationIndex/PublicationIndex'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export const metadata = {
  title: 'Статьи — CAD.kz',
  description: 'Статьи CAD.kz о BIM, САПР, расчётах и оборудовании для проектировщиков.',
}

export default async function ArticlesPage({ searchParams }: Props) {
  return (
    <PublicationIndex
      path="/articles"
      kind="article"
      title="Статьи"
      lead="Разборы, инструкции и практика по BIM, инженерным расчётам и проектированию — от специалистов CAD.kz."
      params={await searchParams}
    />
  )
}
