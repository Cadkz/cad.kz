import type { Metadata } from 'next'
import { AskManager } from '@/components/AskManager/AskManager'
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { Container } from '@/components/Container/Container'
import { PageIntro } from '@/components/PageIntro/PageIntro'
import { ReadingLayout } from '@/components/ReadingLayout/ReadingLayout'
import { RenewForm } from '@/components/RenewForm/RenewForm'
import { RenewSteps } from '@/components/RenewSteps/RenewSteps'
import { getT } from '@/i18n/server'
import { getContacts } from '@/lib/navigation'
import { ALL_LANGS, pageMetadata } from '@/lib/seo'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return pageMetadata({
    title: t('Продление лицензий AutoCAD, Revit, АВС-KZ, ЛИРА-FEM, SCAD Office, GEO5 — CAD.kz'),
    description: t(
      'Продление и обновление лицензий AutoCAD, Revit, АВС-KZ, ЛИРА-FEM, SCAD Office, GEO5 и других программ. Оставьте заявку — менеджер проверит лицензию и пришлёт счёт.',
    ),
    path: '/renew',
    langs: ALL_LANGS,
  })
}

/**
 * «Продление лицензий» — шаблон «Чтение»: слева форма заявки, справа шаги и Кадди с вопросами.
 * ?program=AutoCAD — программа выбрана сразу (ссылки с главной и из шапки).
 */
export default async function RenewPage({ searchParams }: Props) {
  const t = await getT()
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
              <AskManager
                contacts={contacts}
                layout="aside"
                title={t('Есть вопросы?')}
                phrase={t(
                  'Не помните, какая версия стоит, или сомневаетесь в редакции? Помогу разобраться.',
                )}
                message="Здравствуйте! У меня вопрос по продлению лицензии."
              />
            </>
          }
        >
          <PageIntro
            title={t('Продление лицензий')}
            lead={t(
              'Продлим лицензию или обновим версию программы. Укажите, что продлить, — менеджер проверит лицензию и пришлёт счёт.',
            )}
          />
          <RenewForm program={program} />
        </ReadingLayout>
      </Container>
    </main>
  )
}
