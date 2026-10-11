'use client'

import { Check, Minus, Plus, ShoppingCart } from 'lucide-react'
import { lineLabel } from '@/domain/picker.mjs'
import { mainAction } from '@/lib/pickerAction'
import { usePickerCart } from '@/lib/usePickerCart'
import { Button, ButtonLink } from '../Button/Button'
import { usePickerContext } from '../PickerProvider/PickerProvider'
import styles from './PickerSummary.module.css'

/**
 * Итог подбора в боковой колонке: что выбрано, количество, сумма с сервера. Есть цена —
 * главная кнопка «В корзину», вторая — «Получить КП» (`mainAction`); цены нет — одна
 * «Запросить цену». Продление и помощь с выбором — ссылками ниже.
 */
export function PickerSummary() {
  const picker = usePickerContext()
  const { lines, total, quantity, setQuantity, openRequest, meta, view, state, profile } = picker
  const { cartFirst, canAdd, added, addToCart } = usePickerCart()
  const action = mainAction(total, profile)
  const sumText =
    total.state === 'done' || total.state === 'error'
      ? total.text
      : total.state === 'busy'
        ? 'Считаем…'
        : total.state === 'request'
          ? 'По запросу'
          : '—'
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
        <span className={styles.label}>{profile.quantity}</span>
        <div className={styles.stepper}>
          <button type="button" onClick={() => setQuantity(quantity - 1)} aria-label="Меньше">
            <Minus size={16} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <input
            type="number"
            min={1}
            max={999}
            value={quantity}
            aria-label={profile.quantityAria}
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
          {/* key: при каждой новой сумме число заново проявляется — видно, что итог пересчитан. */}
          <span key={sumText} className={styles.sumValue}>
            {sumText}
          </span>
        </output>
      </div>
      {cartFirst &&
        (added ? (
          <ButtonLink href="/cart" block variant="secondary">
            <Check size={20} strokeWidth={1.75} aria-hidden="true" />В корзине — оформить
          </ButtonLink>
        ) : (
          <Button block disabled={!canAdd} onClick={addToCart}>
            <ShoppingCart size={20} strokeWidth={1.75} aria-hidden="true" />В корзину
          </Button>
        ))}
      <Button
        block
        variant={cartFirst ? 'outline' : 'primary'}
        disabled={!lines.length}
        onClick={() => openRequest(action.kind)}
      >
        {action.label}
      </Button>
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
