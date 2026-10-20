import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { breadcrumbLd } from '@/domain/structuredData.mjs'
import { siteUrl } from '@/lib/seo'
import { JsonLd } from '../JsonLd/JsonLd'
import styles from './Breadcrumbs.module.css'

type Crumb = { title: string; href?: string }

/**
 * Хлебные крошки. Последний пункт — текущая страница, без ссылки. Те же крошки — разметкой
 * для поисковиков: в выдаче вместо адреса «Каталог › Программное обеспечение › AutoCAD».
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Хлебные крошки" className={styles.nav}>
      <JsonLd data={breadcrumbLd({ base: siteUrl(), items })} />
      <ol className={styles.list}>
        {items.map((item, i) => (
          <li key={item.href ?? item.title} className={styles.item}>
            {i > 0 && (
              <ChevronRight
                size={16}
                strokeWidth={1.75}
                aria-hidden="true"
                className={styles.sep}
              />
            )}
            {item.href ? (
              <Link href={item.href} className={styles.link}>
                {item.title}
              </Link>
            ) : (
              <span aria-current="page">{item.title}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
