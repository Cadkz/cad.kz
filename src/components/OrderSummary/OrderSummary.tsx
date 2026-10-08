import Link from 'next/link'
import { formatKzt } from '@/lib/format'
import { productHref } from '@/lib/navigationHrefs'
import type { Quote } from '@/lib/useCartQuote'
import { Button } from '../Button/Button'
import styles from './OrderSummary.module.css'

type Props = { quote: Quote | null; busy: boolean; error: string; onRetry: () => void }

/** Состав заказа и итог. Все суммы пришли с сервера, здесь они только показываются. */
export function OrderSummary({ quote, busy, error, onRetry }: Props) {
  return (
    <aside className={styles.summary} aria-label="Состав заказа">
      <h2 className={styles.title}>Ваш заказ</h2>
      <ul className={styles.lines}>
        {quote?.lines.map((line) => (
          <li key={line.offerId} className={styles.line}>
            <div className={styles.info}>
              <Link href={productHref(line.productId)} className={styles.name}>
                {line.title}
              </Link>
              <p className={styles.config}>{line.configuration}</p>
              <p className={styles.qty}>
                {line.quantity} × {formatKzt(line.unitKzt)}
              </p>
            </div>
            <p className={styles.sum}>{formatKzt(line.totalKzt)}</p>
          </li>
        ))}
      </ul>
      <div className={styles.totalRow}>
        <p className={styles.totalLabel}>Итого с НДС</p>
        <p className={styles.total} role="status">
          {busy ? 'Пересчитываем…' : quote ? formatKzt(quote.totalKzt) : '—'}
        </p>
      </div>
      {error && (
        <div role="alert" className={styles.error}>
          <p>{error}</p>
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Повторить расчёт
          </Button>
        </div>
      )}
      <Link href="/cart" className={styles.change}>
        Изменить состав в корзине
      </Link>
    </aside>
  )
}
