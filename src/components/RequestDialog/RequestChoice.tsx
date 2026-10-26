import { Package } from 'lucide-react'
import type { RequestLine } from './RequestDialog'
import styles from './RequestDialog.module.css'

type Props = {
  title: string
  lines: RequestLine[]
  choices: { title: string; value: string }[]
  quantity: number
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

/**
 * Что человек выбрал — одной карточкой: значок, название товара, ниже строкой комплектация,
 * редакция и срок. Строка, повторяющая название («Civil 3D / Civil 3D»), не выводится
 * (замечание владельца 27.10.2026: дубли и синяя черта слева выглядят как шаблон).
 */
export function RequestChoice({ title, lines, choices, quantity }: Props) {
  const parts = [
    ...lines.flatMap((line) => {
      const text = same(line.label, title) ? null : line.label
      return [[text, line.detail].filter(Boolean).join(', ')].filter(Boolean)
    }),
    ...choices.map((choice) => choice.value),
  ]
  const details = [...new Set(parts)].filter((part) => !same(part, title))
  return (
    <div className={styles.choice}>
      <span className={styles.choiceIcon} aria-hidden="true">
        <Package size={20} strokeWidth={1.75} />
      </span>
      <span className={styles.choiceText}>
        <span className={styles.label}>{title}</span>
        {details.length > 0 && <span className={styles.detail}>{details.join(' · ')}</span>}
      </span>
      {quantity > 1 && <span className={styles.qty}>× {quantity}</span>}
    </div>
  )
}
