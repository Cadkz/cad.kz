import { catalogHref } from '@/lib/navigationHrefs'
import { ButtonLink } from '../Button/Button'
import styles from './EmptyCart.module.css'

/**
 * Пустая корзина: объяснение и ссылка в каталог. Общая для корзины и оформления.
 * loading — пока корзина читается в браузере: блок того же размера, текст и кнопка скрыты,
 * чтобы подвал не прыгал, когда корзина окажется пустой.
 */
export function EmptyCart({ loading = false }: { loading?: boolean }) {
  const reserve = loading ? styles.reserve : undefined
  return (
    <div className={styles.empty} role={loading ? 'status' : undefined}>
      <h2>{loading ? 'Загружаем корзину…' : 'В корзине пока пусто'}</h2>
      <p className={reserve}>Выберите решение и подходящую комплектацию в каталоге.</p>
      <ButtonLink href={catalogHref()} className={reserve}>
        Перейти в каталог
      </ButtonLink>
    </div>
  )
}
