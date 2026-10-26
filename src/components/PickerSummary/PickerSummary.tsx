'use client'

import { Minus, Plus } from 'lucide-react'
import { lineLabel } from '@/domain/picker.mjs'
import { pickerActions } from '@/lib/pickerAction'
import { usePickerCart } from '@/lib/usePickerCart'
import { PickerAction } from '../PickerAction/PickerAction'
import { usePickerContext } from '../PickerProvider/PickerProvider'
import styles from './PickerSummary.module.css'

/**
 * Итог подбора в боковой колонке: что выбрано, количество, сумма с сервера. Кнопки — одно правило
 * на весь сайт (src/domain/buyScenario.mjs): одна кнопка («В корзину» или «Запросить цену») и одна
 * ссылка под ней («Помочь с выбором», у сканеров с демонстрацией — запись на демонстрацию).
 * На странице со сканами итог стоит дважды (до сканов и у комплектации) — якорь только у первого.
 */
export function PickerSummary({ anchor = true }: { anchor?: boolean }) {
  const picker = usePickerContext()
  const { lines, total, quantity, setQuantity, meta, view, state, profile } = picker
  const { cartFirst } = usePickerCart()
  const actions = pickerActions(meta, cartFirst)
  const sumText =
    total.state === 'done' || total.state === 'error'
      ? total.text
      : total.state === 'busy'
        ? 'Считаем…'
        : total.state === 'request'
          ? 'По запросу'
          : !view.steps.length
            ? 'По запросу'
            : '—'
  return (
    <div className={styles.box} id={anchor ? 'summary' : undefined}>
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
        <ul className={styles.lines}>
          <li className={styles.line}>
            <span>{meta.productTitle}</span>
          </li>
        </ul>
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
      <PickerAction action={actions.main} variant="primary" />
      {actions.links.map((action) => (
        <div key={action.label} className={styles.links}>
          <PickerAction action={action} variant="text" />
        </div>
      ))}
      <p className={styles.note}>Точную стоимость и сроки подтвердит менеджер.</p>
    </div>
  )
}
