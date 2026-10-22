import { FolderOpen } from 'lucide-react'
import type { Payload } from 'payload'
import styles from './ProductsLink.module.css'
import { isProductsBy, type ProductsBy, productsListUrl, productsWhere } from './productsQuery'

type LinkProps = { by: ProductsBy; id: number | string; payload: Payload; wide?: boolean }

/** Ссылка «Товары (N)»: открывает список товаров, уже отфильтрованный по этой записи. */
async function ProductsLink({ by, id, payload, wide = false }: LinkProps) {
  const { totalDocs } = await payload.count({
    collection: 'products',
    where: productsWhere(by, id),
    overrideAccess: true,
  })
  return (
    <a className={wide ? styles.wide : styles.root} href={productsListUrl(by, id)}>
      <FolderOpen size={16} strokeWidth={1.75} aria-hidden />
      <span>Товары ({totalDocs})</span>
    </a>
  )
}

function asId(value: unknown): number | string | null {
  return typeof value === 'number' || typeof value === 'string' ? value : null
}

type CellProps = { by?: unknown; payload: Payload; rowData: Record<string, unknown> }

/** Колонка «Товары» в списках производителей, линеек и разделов. */
export async function ProductsCell({ by, payload, rowData }: CellProps) {
  const id = asId(rowData.id)
  if (!isProductsBy(by) || id === null) return null
  return <ProductsLink by={by} id={id} payload={payload} />
}

type FieldProps = { by?: unknown; payload: Payload; data?: Record<string, unknown> | null }

/** То же в карточке записи, справа. У новой, ещё не сохранённой записи товаров нет. */
export async function ProductsField({ by, payload, data }: FieldProps) {
  const id = asId(data?.id)
  if (!isProductsBy(by) || id === null) return null
  return (
    <div className={styles.field}>
      <ProductsLink by={by} id={id} payload={payload} wide />
      <p className={styles.hint}>Откроется список товаров только этой записи, как папка.</p>
    </div>
  )
}
