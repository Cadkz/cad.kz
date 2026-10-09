import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { FamilyView } from '@/components/FamilyView/FamilyView'
import { familyMetadata, getFamily } from '@/lib/families'
import { pickParam } from '@/lib/product'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const family = await getFamily((await params).slug)
  return family ? familyMetadata(family) : {}
}

/** Семейство редких товаров: список с галочками и «Запросить КП». */
export default async function FamilyPageRoute({ params, searchParams }: Props) {
  const family = await getFamily((await params).slug)
  if (!family) notFound()
  return <FamilyView family={family} pick={pickParam((await searchParams).pick)} />
}
