import { PropertyList } from '@/components/PropertyList/PropertyList'
import { SpecsPdfLink } from '@/components/SpecsPdfLink/SpecsPdfLink'
import type { Spec } from '@/lib/product'
import styles from './ProductSpecs.module.css'

/** Характеристики товара; у оборудования под ними — «Скачать характеристики, PDF». */
export function ProductSpecs({ items, pdfSlug }: { items: Spec[]; pdfSlug: string | null }) {
  return (
    <div className={styles.root}>
      <PropertyList items={items} />
      {pdfSlug && <SpecsPdfLink slug={pdfSlug} />}
    </div>
  )
}
