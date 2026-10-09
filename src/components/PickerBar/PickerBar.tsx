'use client'

import { usePickerContext } from '../PickerProvider/PickerProvider'
import styles from './PickerBar.module.css'

/** Закреплённая внизу экрана строка на телефоне: итог подбора и переход к нему. */
export function PickerBar() {
  const { total } = usePickerContext()
  const text =
    total.state === 'done'
      ? total.text
      : total.state === 'busy'
        ? 'Считаем…'
        : total.state === 'request'
          ? 'Цена по запросу'
          : 'Выберите комплект'
  return (
    <>
      <div className={styles.spacer} aria-hidden="true" />
      <div className={styles.bar}>
        <span className={styles.price}>{text}</span>
        <a href="#summary" className={styles.button}>
          {total.state === 'request' ? 'Запросить' : 'К итогу'}
        </a>
      </div>
    </>
  )
}
