import { catalogHref } from '@/lib/navigationHrefs'
import { Breadcrumbs } from '../Breadcrumbs/Breadcrumbs'
import { ButtonLink } from '../Button/Button'
import { Container } from '../Container/Container'
import { Mascot } from '../Mascot/Mascot'
import { PageIntro } from '../PageIntro/PageIntro'
import styles from './NotFoundView.module.css'

/**
 * Страница «не найдено»: по-русски, в общей рамке, с выходом в каталог и на главную.
 * Текст на 7 колонок слева, Кади с чертежом справа; на телефоне Кади над текстом.
 */
export function NotFoundView() {
  return (
    <main>
      <title>Страница не найдена — CAD.kz</title>
      <Container>
        <Breadcrumbs items={[{ title: 'Главная', href: '/' }, { title: 'Страница не найдена' }]} />
        <div className={styles.layout}>
          <div className={styles.text}>
            <PageIntro
              title="Страница не найдена"
              lead="Похоже, адрес изменился или страница больше не существует."
            />
            <div className={styles.actions}>
              <ButtonLink href={catalogHref()}>В каталог</ButtonLink>
              <ButtonLink href="/" variant="outline">
                На главную
              </ButtonLink>
              <ButtonLink href="/contacts" variant="text">
                Контакты
              </ButtonLink>
            </div>
          </div>
          <Mascot pose="not-found" size="lg" eager className={styles.mascot} />
        </div>
      </Container>
    </main>
  )
}
