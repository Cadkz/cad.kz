'use client'

// Клиентский: стоит и в карточке каталога (клиентской), и на странице товара.
import Link from '@/components/LangLink/LangLink'
import { useT } from '@/components/LangProvider/LangProvider'
import type { Lifecycle } from '@/lib/equipmentResearch'
import styles from './ProductLifecycle.module.css'

export function ProductLifecycle({ value }: { value?: Lifecycle | null }) {
  const t = useT()
  if (!value) return null
  return (
    <p className={styles.notice}>
      <strong>{t('Снят с производства')}</strong>
      {value.replacement && (
        <span>
          {` ${t('Замена:')} `}
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
