import Link from 'next/link'
import type { MenuColumn, MenuLine } from '@/lib/navigation'
import styles from './MobileVendors.module.css'

type Props = { column: MenuColumn; onNavigate: () => void }

/**
 * Раздел в мобильном меню тем же путём, что и в шапке: производители → линейки → товары, шагами
 * (раскрывающиеся строки). Шаг с единственным вариантом не показывается.
 */
export function MobileVendors({ column, onNavigate }: Props) {
  const links = (line: MenuLine) => (
    <>
      {line.links.map((link) => (
        <Link key={link.href} href={link.href} className={styles.link} onClick={onNavigate}>
          {link.title}
        </Link>
      ))}
      {line.more && (
        <Link href={line.allHref} className={styles.all} onClick={onNavigate}>
          Смотреть все
        </Link>
      )}
    </>
  )
  const lines = (items: MenuLine[]) =>
    items.length === 1
      ? links(items[0])
      : items.map((line) => (
          <details key={line.key} className={styles.step}>
            <summary className={styles.summary}>{line.title}</summary>
            <div className={styles.body}>{links(line)}</div>
          </details>
        ))

  if (column.vendors.length === 1) return lines(column.vendors[0].lines)
  return column.vendors.map((vendor) => (
    <details key={vendor.key} className={styles.step}>
      <summary className={styles.summary}>{vendor.title}</summary>
      <div className={styles.body}>{lines(vendor.lines)}</div>
    </details>
  ))
}
