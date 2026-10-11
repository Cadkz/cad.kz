import type { Metadata } from 'next'
import { AsideContacts } from '@/components/AsideContacts/AsideContacts'
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { Container } from '@/components/Container/Container'
import { PageIntro } from '@/components/PageIntro/PageIntro'
import { ReadingLayout } from '@/components/ReadingLayout/ReadingLayout'
import { RenewForm } from '@/components/RenewForm/RenewForm'
import { RenewSteps } from '@/components/RenewSteps/RenewSteps'
import { getContacts } from '@/lib/navigation'
import { pageMetadata } from '@/lib/seo'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export const metadata: Metadata = pageMetadata({
  title: 'Продление лицензий AutoCAD, АВС, ЛИРА, SCAD, GEO5 — CAD.kz',
  description:
    'Продление и обновление лицензий AutoCAD, АВС, ЛИРА-FEM, SCAD Office, GEO5 и других программ. ' +
    'Оставьте заявку — менеджер проверит лицензию и пришлёт счёт.',
  path: '/renew',
})

/**
 * «Продление лицензий» — шаблон «Чтение»: слева форма заявки, справа шаги и контакты.
 * ?program=AutoCAD — программа выбрана сразу (ссылки с главной и из шапки).
 */
export default async function RenewPage({ searchParams }: Props) {
  const [params, contacts] = await Promise.all([searchParams, getContacts()])
  const raw = Array.isArray(params.program) ? params.program[0] : params.program
  const program = raw && raw.length <= 60 ? raw : null
  return (
    <main>
      <Container>
        <Breadcrumbs items={[{ title: 'Главная', href: '/' }, { title: 'Продление лицензий' }]} />
        <ReadingLayout
          aside={
            <>
              <RenewSteps />
              <AsideContacts contacts={contacts} />
            </>
          }
        >
          <PageIntro
            title="Продление лицензий"
            lead="Продлим подписку или обновим версию программы. Укажите, что продлить, — менеджер проверит лицензию и пришлёт счёт."
          />
          <RenewForm program={program} />
        </ReadingLayout>
      </Container>
    </main>
  )
}
