'use client'

import { Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { lineLabel } from '@/domain/picker.mjs'
import { mainAction } from '@/lib/pickerAction'
import { Button, ButtonLink } from '../Button/Button'
import { useCart } from '../CartProvider/CartProvider'
import { usePickerContext } from '../PickerProvider/PickerProvider'
import styles from './PickerSummary.module.css'

/**
 * Итог подбора в боковой колонке: что выбрано, количество, сумма с сервера. Одно главное
 * действие (`mainAction`), ниже — «В корзину» для закупки нескольких программ, продление и
 * помощь с выбором ссылками.
 */
export function PickerSummary() {
  const picker = usePickerContext()
  const { lines, total, quantity, setQuantity, openRequest, meta, view, state } = picker
  const { add, ready } = useCart()
  const [added, setAdded] = useState(false)
  const action = mainAction(total)

  function toCart() {
    for (const line of lines) if (line.offer) add({ offerId: line.offer.id, quantity })
    setAdded(true)
  }

  const canBuy = !meta.familySlug && total.state === 'done' && ready
  return (
    <div className={styles.box} id="summary">
      <p className={styles.label}>Ваш выбор</p>
      {lines.length ? (
        <ul className={styles.lines}>
          {view.switches.map((sw) => (
            <li key={sw.key} className={styles.line}>
              <span>{sw.title}</span>
              <span className={styles.price}>{state.switches[sw.key]}</span>
            </li>
          ))}
          {lines.map((line) => (
            <li key={line.item.key} className={styles.line}>
              <span>{lineLabel(line)}</span>
              <span className={styles.price}>{line.offer?.price ?? 'по запросу'}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.note}>Отметьте, что нужно, — итог посчитается сразу.</p>
      )}
      <div className={styles.row}>
        <span className={styles.label}>Количество</span>
        <div className={styles.stepper}>
          <button type="button" onClick={() => setQuantity(quantity - 1)} aria-label="Меньше">
            <Minus size={16} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <input
            type="number"
            min={1}
            max={999}
            value={quantity}
            aria-label="Количество рабочих мест"
            onChange={(event) => setQuantity(Number(event.target.value))}
          />
          <button type="button" onClick={() => setQuantity(quantity + 1)} aria-label="Больше">
            <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className={styles.total}>
        <span className={styles.label}>Итого с НДС</span>
        <output className={styles.sum} data-state={total.state} aria-live="polite">
          {total.state === 'done' || total.state === 'error'
            ? total.text
            : total.state === 'busy'
              ? 'Считаем…'
              : total.state === 'request'
                ? 'По запросу'
                : '—'}
        </output>
      </div>
      <Button block disabled={!lines.length} onClick={() => openRequest(action.kind)}>
        {action.label}
      </Button>
      {canBuy &&
        (added ? (
          <ButtonLink href="/cart" block variant="outline">
            Добавлено — перейти в корзину
          </ButtonLink>
        ) : (
          <Button block variant="outline" onClick={toCart}>
            В корзину
          </Button>
        ))}
      <div className={styles.links}>
        {meta.renewLabel && (
          <Button variant="text" size="sm" onClick={() => openRequest('renew')}>
            {meta.renewLabel}
          </Button>
        )}
        <Button variant="text" size="sm" onClick={() => openRequest('help')}>
          Помочь с выбором
        </Button>
      </div>
      <p className={styles.note}>
        Учебные цены демоверсии. Точную стоимость и сроки подтвердит менеджер.
      </p>
    </div>
  )
}
