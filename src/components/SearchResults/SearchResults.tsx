import Link from 'next/link'
import type { CatalogItem } from '@/lib/catalog'
import { catalogHref } from '@/lib/navigationHrefs'
import { positions } from '@/lib/plural'
import { AskKaddi } from '../AskKaddi/AskKaddi'
import { Grid } from '../Grid/Grid'
import { WhatsappIcon } from '../icons/icons'
import { Mascot } from '../Mascot/Mascot'
import { ProductCard } from '../ProductCard/ProductCard'
import styles from './SearchResults.module.css'

type Props = {
  query: string
  items: CatalogItem[]
  /** Нашлись не все слова запроса: показываем похожее и говорим об этом. */
  partial?: boolean
  /** Дополнения к найденным программам — отдельной группой под ними. */
  addons?: CatalogItem[]
  /** Программы, к которым эти дополнения. */
  bases?: string[]
  whatsappHref: string | null
}

function Cards({ items }: { items: CatalogItem[] }) {
  return (
    <Grid as="ul" span={{ base: 12, sm: 6, md: 4 }} className={styles.list}>
      {items.map((item) => (
        <li key={item.id}>
          <ProductCard product={item} />
        </li>
      ))}
    </Grid>
  )
}

/**
 * Результаты поиска карточками каталога. Ничего не нашлось — не тупик: написать, что ищете,
 * в WhatsApp (текст уже набран) или перейти в каталог.
 */
export function SearchResults({
  query,
  items,
  partial = false,
  addons = [],
  bases = [],
  whatsappHref,
}: Props) {
  if (!query.trim()) return null
  if (!items.length) {
    const text = `Здравствуйте! Ищу на сайте: ${query}. Подскажите, пожалуйста.`
    return (
      <div className={styles.empty}>
        <div className={styles.emptyBody}>
          <p className={styles.emptyTitle}>Ничего не найдено</p>
          <p className={styles.emptyText}>
            По запросу «{query}» товаров нет. Проверьте написание, измените запрос или напишите, что
            ищете, — менеджер подскажет.
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
            <AskKaddi variant="text" />
          </div>
        </div>
        <Mascot pose="search" className={styles.mascot} />
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
      <Cards items={items} />
      {addons.length > 0 && (
        <>
          <h2 className={styles.group}>Дополнения для {bases.join(', ')}</h2>
          <Cards items={addons} />
        </>
      )}
    </section>
  )
}
