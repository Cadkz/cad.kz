import { catalogHref } from '@/lib/navigationHrefs'
import { Breadcrumbs } from '../Breadcrumbs/Breadcrumbs'
import { ButtonLink } from '../Button/Button'
import { Container } from '../Container/Container'
import { PageIntro } from '../PageIntro/PageIntro'
import styles from './NotFoundView.module.css'

/** Страница «не найдено»: по-русски, в общей рамке, с выходом в каталог и на главную. */
export function NotFoundView() {
  return (
    <main>
      <title>Страница не найдена — CAD.kz</title>
      <Container>
        <Breadcrumbs items={[{ title: 'Главная', href: '/' }, { title: 'Страница не найдена' }]} />
        <PageIntro
          title="Страница не найдена"
          lead="Возможно, адрес устарел или в нём опечатка. Товар можно найти в каталоге, а если не получается — напишите нам, подскажем."
        />
        <div className={styles.actions}>
          <ButtonLink href={catalogHref()}>Перейти в каталог</ButtonLink>
          <ButtonLink href="/" variant="outline">
            На главную
          </ButtonLink>
          <ButtonLink href="/contacts" variant="text">
            Контакты
          </ButtonLink>
        </div>
      </Container>
    </main>
  )
}
