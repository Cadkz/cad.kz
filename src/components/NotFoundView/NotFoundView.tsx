import { catalogHref } from '@/lib/navigationHrefs'
import { AskKaddi } from '../AskKaddi/AskKaddi'
import { Breadcrumbs } from '../Breadcrumbs/Breadcrumbs'
import { ButtonLink } from '../Button/Button'
import { Container } from '../Container/Container'
import { Mascot } from '../Mascot/Mascot'
import { PageIntro } from '../PageIntro/PageIntro'
import styles from './NotFoundView.module.css'

/**
 * Страница «не найдено»: по-русски, в общей рамке, с выходом в каталог и на главную.
 * Текст на 7 колонок слева, Кадди с чертежом справа; на телефоне Кадди над текстом.
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
              title="404. Кажется, эта страница потерялась среди чертежей"
              lead="Возможно, адрес изменился или страница больше недоступна. Кадди поможет найти нужный раздел."
            />
            <div className={styles.actions}>
              <ButtonLink href="/">На главную</ButtonLink>
              <ButtonLink href={catalogHref()} variant="outline">
                В каталог
              </ButtonLink>
              <AskKaddi label="Задать вопрос Кадди" variant="text" />
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
