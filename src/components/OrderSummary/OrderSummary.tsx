import Link from '@/components/LangLink/LangLink'
import { useT } from '@/components/LangProvider/LangProvider'
import { lineKzt, totalKzt } from '@/lib/format'
import { productHref } from '@/lib/navigationHrefs'
import type { Quote } from '@/lib/useCartQuote'
import { Button } from '../Button/Button'
import styles from './OrderSummary.module.css'

type Props = { quote: Quote | null; busy: boolean; error: string; onRetry: () => void }

/** Состав заказа и итог. Все суммы пришли с сервера, здесь они только показываются. */
export function OrderSummary({ quote, busy, error, onRetry }: Props) {
  const t = useT()
  return (
    <aside className={styles.summary} aria-label={t('Состав заказа')}>
      <h2 className={styles.title}>{t('Ваш заказ')}</h2>
      <ul className={styles.lines}>
        {quote?.lines.map((line) => (
          <li key={line.offerId} className={styles.line}>
            <div className={styles.info}>
              <Link href={productHref(line.productId)} className={styles.name}>
                {line.title}
              </Link>
              <p className={styles.config}>{line.configuration}</p>
              <p className={styles.qty}>
                {line.request
                  ? t('{count} шт.', { count: line.quantity })
                  : `${line.quantity} × ${lineKzt(line.unitKzt, t)}`}
              </p>
            </div>
            <p className={styles.sum}>
              {line.request ? t('По запросу') : lineKzt(line.totalKzt, t)}
            </p>
          </li>
        ))}
      </ul>
      <div className={styles.totalRow}>
        <p className={styles.totalLabel}>{t('Итого с НДС')}</p>
        <p className={styles.total} role="status">
          {busy
            ? t('Пересчитываем…')
            : quote
              ? totalKzt(
                  quote.totalKzt,
                  quote.lines.some((line) => line.request),
                )
              : '—'}
        </p>
      </div>
      {error && (
        <div role="alert" className={styles.error}>
          <p>{error}</p>
          <Button variant="secondary" size="sm" onClick={onRetry}>
            {t('Повторить расчёт')}
          </Button>
        </div>
      )}
      <Link href="/cart" className={styles.change}>
        {t('Изменить состав в корзине')}
      </Link>
    </aside>
  )
}
