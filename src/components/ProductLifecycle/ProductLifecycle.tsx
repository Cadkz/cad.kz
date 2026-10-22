import Link from 'next/link'
import type { Lifecycle } from '@/lib/equipmentResearch'
import styles from './ProductLifecycle.module.css'

export function ProductLifecycle({ value }: { value?: Lifecycle | null }) {
  if (!value) return null
  return (
    <p className={styles.notice}>
      <strong>Снят с производства</strong>
      {value.replacement && (
        <span>
          {' Замена: '}
          {value.replacement.href ? (
            <Link className={styles.link} href={value.replacement.href}>
              {value.replacement.title}
            </Link>
          ) : (
            value.replacement.title
          )}
        </span>
      )}
    </p>
  )
}
