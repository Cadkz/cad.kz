import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { Container } from '@/components/Container/Container'
import { MascotGallery } from '@/components/MascotGallery/MascotGallery'
import { PageIntro } from '@/components/PageIntro/PageIntro'
import { isProduction } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Юки — позы персонажа — CAD.kz',
  robots: { index: false, follow: false },
}

/** Служебная страница демоверсии: все позы Юки. На рабочем сайте её нет (404). */
export default function YukiPage() {
  if (isProduction()) notFound()
  return (
    <main>
      <Container>
        <Breadcrumbs items={[{ title: 'Главная', href: '/' }, { title: 'Юки' }]} />
        <PageIntro
          title="Юки — позы персонажа"
          lead="Служебная страница демоверсии, на рабочем сайте её не будет. Юки моргает раз в 4–7 секунд и ещё раз при наведении."
        />
        <MascotGallery />
      </Container>
    </main>
  )
}
