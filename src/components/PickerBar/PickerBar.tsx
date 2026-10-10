'use client'

import { mainAction } from '@/lib/pickerAction'
import { usePickerContext } from '../PickerProvider/PickerProvider'
import styles from './PickerBar.module.css'

/**
 * Закреплённая внизу экрана строка на телефоне: сумма (или «Цена по запросу») и то же главное
 * действие, что в итоге справа. Пока ничего не выбрано — переход к выбору комплекта.
 */
export function PickerBar() {
  const { total, lines, openRequest, profile } = usePickerContext()
  const action = mainAction(total, profile)
  const text =
    total.state === 'done'
      ? total.text
      : total.state === 'busy'
        ? 'Считаем…'
        : total.state === 'request'
          ? 'Цена по запросу'
          : 'Выберите комплект'
  return (
    <div className={styles.bar} data-bottom-bar>
      <span className={styles.price}>{text}</span>
      {lines.length ? (
        <button type="button" className={styles.button} onClick={() => openRequest(action.kind)}>
          {action.label}
        </button>
      ) : (
        <a href="#config" className={styles.button}>
          Выбрать
        </a>
      )}
    </div>
  )
}
