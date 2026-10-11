'use client'

import Link from 'next/link'
import { mainAction } from '@/lib/pickerAction'
import { usePickerCart } from '@/lib/usePickerCart'
import { usePickerContext } from '../PickerProvider/PickerProvider'
import styles from './PickerBar.module.css'

/**
 * Закреплённая внизу экрана строка на телефоне: сумма (или «Цена по запросу») и то же главное
 * действие, что в итоге: «В корзину», если есть цена, иначе «Запросить цену». После добавления —
 * ссылка в корзину. Пока ничего не выбрано — переход к выбору комплекта.
 */
export function PickerBar() {
  const { total, lines, openRequest, profile } = usePickerContext()
  const action = mainAction(total, profile)
  const { cartFirst, canAdd, added, addToCart } = usePickerCart()
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
      {!lines.length ? (
        <a href="#config" className={styles.button}>
          Выбрать
        </a>
      ) : added ? (
        <Link href="/cart" className={styles.button}>
          В корзине — оформить
        </Link>
      ) : cartFirst ? (
        <button type="button" className={styles.button} disabled={!canAdd} onClick={addToCart}>
          В корзину
        </button>
      ) : (
        <button type="button" className={styles.button} onClick={() => openRequest(action.kind)}>
          {action.label}
        </button>
      )}
    </div>
  )
}
