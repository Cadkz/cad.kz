'use client'

import Link from '@/components/LangLink/LangLink'
import { useT } from '@/components/LangProvider/LangProvider'
import { requestNeedsChoice } from '@/domain/pickerRequest.mjs'
import { pickerActions } from '@/lib/pickerAction'
import { usePickerCart } from '@/lib/usePickerCart'
import { usePickerContext } from '../PickerProvider/PickerProvider'
import styles from './PickerBar.module.css'

/**
 * Закреплённая внизу экрана строка на телефоне: сумма (или «Цена по запросу») и то же главное
 * действие, что в итоге (по сценарию покупки). После добавления в корзину — ссылка в корзину.
 * Пока ничего не выбрано — переход к выбору комплекта (кроме действий без выбора: подбор,
 * консультация, демонстрация).
 */
export function PickerBar() {
  const t = useT()
  const { total, lines, openRequest, meta, view } = usePickerContext()
  const { cartFirst, canAdd, added, addToCart } = usePickerCart()
  const action = pickerActions(meta, cartFirst).main
  const needsChoice =
    action.type === 'cart' ||
    (action.type === 'request' &&
      requestNeedsChoice(action.kind, view.steps.length > 0, Boolean(meta.familySlug)))
  const text =
    total.state === 'done'
      ? total.text
      : total.state === 'busy'
        ? t('Считаем…')
        : total.state === 'request' || !view.steps.length
          ? t('Цена по запросу')
          : t('Выберите комплект')
  return (
    <div className={styles.bar} data-bottom-bar>
      <span className={styles.price}>{text}</span>
      {!lines.length && needsChoice ? (
        <a href="#config" className={styles.button}>
          {t('Выбрать')}
        </a>
      ) : added ? (
        <Link href="/cart" className={styles.button}>
          {t('В корзине — оформить')}
        </Link>
      ) : action.type === 'cart' ? (
        <button type="button" className={styles.button} disabled={!canAdd} onClick={addToCart}>
          {t(action.label)}
        </button>
      ) : action.type === 'request' ? (
        <button
          type="button"
          className={styles.button}
          onClick={() => openRequest(action.kind, action.label)}
        >
          {t(action.label)}
        </button>
      ) : (
        <a href={action.href} className={styles.button}>
          {t(action.label)}
        </a>
      )}
    </div>
  )
}
