import { CircleCheck, CreditCard, Landmark, Truck } from 'lucide-react'
import type { PurchaseTerm } from '@/lib/purchaseTerms'
import styles from './PurchaseTerms.module.css'

/** Значок по смыслу заголовка: сроки и доставка, оплата, бюджет и тендеры, остальное — галочка. */
function TermIcon({ title }: { title: string }) {
  const props = { size: 20, strokeWidth: 1.75, 'aria-hidden': true } as const
  if (/срок|постав|достав/i.test(title)) return <Truck {...props} />
  if (/оплат/i.test(title)) return <CreditCard {...props} />
  if (/тендер|бюджет|закуп/i.test(title)) return <Landmark {...props} />
  return <CircleCheck {...props} />
}

/** Условия покупки на странице товара: сроки, оплата, тендеры — карточками в ряд. */
export function PurchaseTerms({ terms }: { terms: PurchaseTerm[] }) {
  return (
    <ul className={styles.list}>
      {terms.map((term) => (
        <li key={term.title} className={styles.item}>
          <span className={styles.icon}>
            <TermIcon title={term.title} />
          </span>
          <h3 className={styles.title}>{term.title}</h3>
          <p className={styles.text}>{term.text}</p>
        </li>
      ))}
    </ul>
  )
}
