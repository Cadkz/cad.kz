import type { Metadata } from 'next'
import { InfoPageView, infoPageMetadata } from '@/components/InfoPageView/InfoPageView'

export function generateMetadata(): Promise<Metadata> {
  return infoPageMetadata('about')
}

/** «О компании» — текст из «Страниц» (код about). */
export default function AboutPage() {
  return <InfoPageView slug="about" />
}
