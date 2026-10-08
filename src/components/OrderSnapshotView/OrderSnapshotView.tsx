import type { UIFieldServerComponent } from 'payload'
import { formatDateTime, formatDay, formatKzt, formatKztMinor } from '@/lib/format'
import styles from './OrderSnapshotView.module.css'

type SnapshotLine = {
  productTitle: string
  configuration: string
  license: string
  quantity: number
  source: { amount: string; currency: string; includesVat: boolean; vat: string }
  rate: { kztPerUnit: string; date: string | null }
  unitKzt: string
  totalKzt: string
}

type Snapshot = {
  rule: string
  quotedAt: string
  targetVat: string
  lines: SnapshotLine[]
  totalKzt: string
  vatMinor: string
}

function isSnapshot(value: unknown): value is Snapshot {
  return Boolean(value && typeof value === 'object' && 'lines' in value && 'totalKzt' in value)
}

function sourcePrice({ source }: SnapshotLine) {
  const vat = source.includesVat ? `с НДС ${source.vat}%` : 'без НДС'
  return `${source.amount} ${source.currency}, ${vat}`
}

function rateText({ source, rate }: SnapshotLine) {
  if (source.currency === 'KZT') return 'тенге, пересчёта нет'
  const date = rate.date ? formatDay(rate.date) : 'дата не указана'
  return `${rate.kztPerUnit} ₸ за 1 ${source.currency}, курс от ${date}`
}

/**
 * Состав заказа в админке: что и по какой цене выбрал покупатель. Показывает сохранённый снимок,
 * а не текущие цены каталога. Только чтение, права проверяются по пользователю админки.
 */
export const OrderSnapshotView: UIFieldServerComponent = async ({ id, payload, user }) => {
  if (!id) return null
  const order = await payload.findByID({
    collection: 'orders',
    id,
    depth: 0,
    user,
    overrideAccess: false,
  })
  const snapshot: unknown = order.snapshot
  if (!isSnapshot(snapshot)) return null

  return (
    <section className={styles.root} aria-label="Состав заказа">
      <h3 className={styles.title}>Состав заказа</h3>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Товар и комплектация</th>
              <th>Цена в каталоге</th>
              <th>Курс</th>
              <th className={styles.num}>За единицу</th>
              <th className={styles.num}>Кол-во</th>
              <th className={styles.num}>Сумма</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.lines.map((line) => (
              <tr key={`${line.productTitle}-${line.configuration}`}>
                <td>
                  <strong>{line.productTitle}</strong>
                  <br />
                  {line.configuration}
                  {line.license && <span className={styles.muted}>, {line.license}</span>}
                </td>
                <td>{sourcePrice(line)}</td>
                <td>{rateText(line)}</td>
                <td className={styles.num}>{formatKzt(line.unitKzt)}</td>
                <td className={styles.num}>{line.quantity}</td>
                <td className={styles.num}>{formatKzt(line.totalKzt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dl className={styles.totals}>
        <dt>Итого с НДС</dt>
        <dd className={styles.total}>{formatKzt(snapshot.totalKzt)}</dd>
        <dt>НДС {snapshot.targetVat}% внутри суммы</dt>
        <dd>{formatKztMinor(snapshot.vatMinor)}</dd>
        <dt>Цена рассчитана</dt>
        <dd>{formatDateTime(snapshot.quotedAt)}</dd>
        <dt>Правило расчёта</dt>
        <dd>{snapshot.rule}</dd>
      </dl>
    </section>
  )
}
