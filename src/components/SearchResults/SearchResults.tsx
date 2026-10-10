import Link from 'next/link'
import type { CatalogItem } from '@/lib/catalog'
import { catalogHref } from '@/lib/navigationHrefs'
import { positions } from '@/lib/plural'
import { Grid } from '../Grid/Grid'
import { WhatsappIcon } from '../icons/icons'
import { ProductCard } from '../ProductCard/ProductCard'
import styles from './SearchResults.module.css'

type Props = {
  query: string
  items: CatalogItem[]
  /** Нашлись не все слова запроса: показываем похожее и говорим об этом. */
  partial?: boolean
  whatsappHref: string | null
}

/**
 * Результаты поиска карточками каталога. Ничего не нашлось — не тупик: написать, что ищете,
 * в WhatsApp (текст уже набран) или перейти в каталог.
 */
export function SearchResults({ query, items, partial = false, whatsappHref }: Props) {
  if (!query.trim()) return null
  if (!items.length) {
    const text = `Здравствуйте! Ищу на сайте: ${query}. Подскажите, пожалуйста.`
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>По запросу «{query}» ничего не нашлось</p>
        <p className={styles.emptyText}>
          Проверьте написание или напишите, что ищете, — менеджер подскажет.
        </p>
        <div className={styles.actions}>
          {whatsappHref && (
            <a
              href={`${whatsappHref}?text=${encodeURIComponent(text)}`}
              className={styles.whatsapp}
              target="_blank"
              rel="noreferrer"
            >
              <WhatsappIcon size={20} />
              Спросить в WhatsApp
            </a>
          )}
          <Link href={catalogHref()} className={styles.catalog}>
            Перейти в каталог
          </Link>
        </div>
      </div>
    )
  }
  return (
    <section className={styles.results} aria-label="Результаты поиска">
      <p className={styles.count} aria-live="polite">
        {partial
          ? `Точно по запросу ничего нет — похожее: ${positions(items.length)}`
          : `Найдено: ${positions(items.length)}`}
      </p>
      <Grid as="ul" span={{ base: 12, sm: 6, md: 4 }} className={styles.list}>
        {items.map((item) => (
          <li key={item.id}>
            <ProductCard product={item} />
          </li>
        ))}
      </Grid>
    </section>
  )
}
