import { Gavel, PackageCheck, ShieldCheck, Wallet } from 'lucide-react'
import type { PurchaseTerm } from '@/lib/purchaseTerms'
import styles from './PurchaseTerms.module.css'

/** Значок по смыслу заголовка: сроки и доставка, оплата, бюджет и тендеры, остальное — щит. */
function TermIcon({ title }: { title: string }) {
  const props = { size: 16, strokeWidth: 1.75, 'aria-hidden': true } as const
  if (/срок|постав|достав/i.test(title)) return <PackageCheck {...props} />
  if (/оплат/i.test(title)) return <Wallet {...props} />
  if (/тендер|бюджет|закуп/i.test(title)) return <Gavel {...props} />
  return <ShieldCheck {...props} />
}

/**
 * Условия покупки — синяя плашка в колонке покупки под итогом и кнопками (решение владельца
 * 02.11.2026): отличается от белых блоков, видна рядом с ценой. Компактно (03.11.2026, 18:15):
 * строка на условие — значок, «Оплата:» и текст, чтобы карточка и условия поместились на
 * экране ноутбука.
 */
export function PurchaseTerms({ terms }: { terms: PurchaseTerm[] }) {
  return (
    <section className={styles.box} aria-labelledby="terms-title">
      <h2 id="terms-title" className={styles.heading}>
        Условия покупки
      </h2>
      <ul className={styles.list}>
        {terms.map((term) => (
          <li key={term.title} className={styles.item}>
            <span className={styles.icon}>
              <TermIcon title={term.title} />
            </span>
            <p className={styles.text}>
              <strong className={styles.title}>{term.title}:</strong> {term.text}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
