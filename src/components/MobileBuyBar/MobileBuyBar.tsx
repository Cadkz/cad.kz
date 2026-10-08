import styles from './MobileBuyBar.module.css'

/** Закреплённая внизу экрана кнопка покупки на телефоне (шаблон «Товар»). */
export function MobileBuyBar({
  priceFrom,
  several,
}: {
  priceFrom: string | null
  several: boolean
}) {
  return (
    <>
      <div className={styles.spacer} aria-hidden="true" />
      <div className={styles.bar}>
        <span className={styles.price}>
          {priceFrom ? `${several ? 'от ' : ''}${priceFrom}` : 'Цена по запросу'}
        </span>
        <a href="#config" className={styles.button}>
          {several ? 'Выбрать' : 'Купить'}
        </a>
      </div>
    </>
  )
}
