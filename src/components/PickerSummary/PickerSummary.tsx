'use client'

import { Minus, Plus } from 'lucide-react'
import { useT } from '@/components/LangProvider/LangProvider'
import { lineLabel } from '@/domain/picker.mjs'
import { pickerActions } from '@/lib/pickerAction'
import { usePickerCart } from '@/lib/usePickerCart'
import { PickerAction } from '../PickerAction/PickerAction'
import { PickerAsk } from '../PickerAsk/PickerAsk'
import { PickerCartIcon } from '../PickerCartIcon/PickerCartIcon'
import { PickerDirect } from '../PickerDirect/PickerDirect'
import { usePickerContext } from '../PickerProvider/PickerProvider'
import styles from './PickerSummary.module.css'

/**
 * Итог подбора в боковой колонке: что выбрано, количество, сумма с сервера. Кнопки — одно правило
 * на весь сайт (src/domain/buyScenario.mjs, решение владельца 27.10.2026): синяя заявка, рядом
 * квадрат с корзиной (если корзина возможна), ниже «Задать вопрос» — чат с Кадди, под ним
 * строкой «WhatsApp» и «Нашли дешевле?» (PickerDirect); у сканеров
 * с демонстрацией — ещё ссылка «Записаться на демонстрацию».
 * На странице со сканами итог стоит дважды (до сканов и у комплектации) — якорь только у первого.
 */
export function PickerSummary({ anchor = true }: { anchor?: boolean }) {
  const t = useT()
  const picker = usePickerContext()
  const { lines, total, quantity, setQuantity, meta, view, state, profile, show } = picker
  const { cartFirst } = usePickerCart()
  const actions = pickerActions(meta, cartFirst)
  const sumText =
    total.state === 'done' || total.state === 'error'
      ? total.text
      : total.state === 'busy'
        ? t('Считаем…')
        : total.state === 'request'
          ? t('По запросу')
          : !view.steps.length
            ? t('По запросу')
            : '—'
  return (
    <div className={styles.box} id={anchor ? 'summary' : undefined}>
      <p className={styles.label}>{t('Ваш выбор')}</p>
      {lines.length ? (
        <ul className={styles.lines}>
          {view.switches.map((sw) => (
            <li key={sw.key} className={styles.line}>
              <span>{show(sw.title)}</span>
              <span className={styles.price}>{show(state.switches[sw.key] ?? '')}</span>
            </li>
          ))}
          {lines.map((line) => (
            <li key={line.item.key} className={styles.line}>
              <span>{show(lineLabel(line))}</span>
              <span className={styles.price}>{line.offer?.price ?? t('по запросу')}</span>
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
        <span className={styles.label}>{t(profile.quantity)}</span>
        <div className={styles.stepper}>
          <button type="button" onClick={() => setQuantity(quantity - 1)} aria-label={t('Меньше')}>
            <Minus size={16} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <input
            type="number"
            min={1}
            max={999}
            value={quantity}
            aria-label={t(profile.quantityAria)}
            onChange={(event) => setQuantity(Number(event.target.value))}
          />
          <button type="button" onClick={() => setQuantity(quantity + 1)} aria-label={t('Больше')}>
            <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className={styles.total}>
        <span className={styles.label}>{t('Итого с НДС')}</span>
        <output className={styles.sum} data-state={total.state} aria-live="polite">
          {/* key: при каждой новой сумме число заново проявляется — видно, что итог пересчитан. */}
          <span key={sumText} className={styles.sumValue}>
            {sumText}
          </span>
        </output>
      </div>
      <div className={styles.actions}>
        <PickerAction action={actions.main} variant="primary" />
        {actions.second?.type === 'cart' && <PickerCartIcon title={meta.productTitle} />}
      </div>
      <PickerAsk />
      <PickerDirect />
      {actions.links.map((action) => (
        <div key={action.label} className={styles.links}>
          <PickerAction action={action} variant="text" />
        </div>
      ))}
      <p className={styles.note}>{t('Точную стоимость и сроки подтвердит менеджер.')}</p>
    </div>
  )
}
