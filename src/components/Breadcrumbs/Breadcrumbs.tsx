import { ChevronRight } from 'lucide-react'
import Link from '@/components/LangLink/LangLink'
import { NAV_BACK } from '@/domain/motion.mjs'
import { breadcrumbLd } from '@/domain/structuredData.mjs'
import { getT } from '@/i18n/server'
import { siteUrl } from '@/lib/seo'
import { JsonLd } from '../JsonLd/JsonLd'
import styles from './Breadcrumbs.module.css'

type Crumb = { title: string; href?: string }

/**
 * Хлебные крошки. Последний пункт — текущая страница, без ссылки. Те же крошки — разметкой
 * для поисковиков: в выдаче вместо адреса «Каталог › Программное обеспечение › AutoCAD».
 */
export async function Breadcrumbs({ items: source }: { items: Crumb[] }) {
  const t = await getT()
  // Подписи разделов («Главная», «Каталог») — по словарю; названия товаров остаются как есть.
  const items = source.map((item) => ({ ...item, title: t(item.title) }))
  return (
    <nav aria-label={t('Хлебные крошки')} className={styles.nav}>
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
              <Link href={item.href} className={styles.link} transitionTypes={NAV_BACK}>
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
