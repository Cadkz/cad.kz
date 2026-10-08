import { catalogHref } from '@/lib/navigationHrefs'
import { ButtonLink } from '../Button/Button'
import styles from './EmptyCart.module.css'

/** Пустая корзина: объяснение и ссылка в каталог. Общая для корзины и оформления. */
export function EmptyCart() {
  return (
    <div className={styles.empty}>
      <h2>В корзине пока пусто</h2>
      <p>Выберите решение и подходящую комплектацию в каталоге.</p>
      <ButtonLink href={catalogHref()}>Перейти в каталог</ButtonLink>
    </div>
  )
}
