import Link from '@/components/LangLink/LangLink'
import { getT } from '@/i18n/server'
import type { CatalogItem } from '@/lib/catalog'
import { catalogHref } from '@/lib/navigationHrefs'
import { positions } from '@/lib/plural'
import { AskKaddi } from '../AskKaddi/AskKaddi'
import { Grid } from '../Grid/Grid'
import { WhatsappIcon } from '../icons/icons'
import { Mascot } from '../Mascot/Mascot'
import { ProductCard } from '../ProductCard/ProductCard'
import { SearchTracker } from '../SearchTracker/SearchTracker'
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
  const found = partial ? 0 : items.length + addons.length
  return (
    <SearchTracker query={query} found={found}>
      <Found
        query={query}
        items={items}
        partial={partial}
        addons={addons}
        bases={bases}
        whatsappHref={whatsappHref}
      />
    </SearchTracker>
  )
}

async function Found({
  query,
  items,
  partial = false,
  addons = [],
  bases = [],
  whatsappHref,
}: Props) {
  const t = await getT()
  if (!items.length) {
    const text = `Здравствуйте! Ищу на сайте: ${query}. Подскажите, пожалуйста.`
    return (
      <div className={styles.empty}>
        <div className={styles.emptyBody}>
          <p className={styles.emptyTitle}>{t('Ничего не найдено')}</p>
          <p className={styles.emptyText}>
            {t(
              'По запросу «{query}» товаров нет. Проверьте написание, измените запрос или напишите, что ищете, — менеджер подскажет.',
              { query },
            )}
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
                {t('Спросить в WhatsApp')}
              </a>
            )}
            <Link href={catalogHref()} className={styles.catalog}>
              {t('Перейти в каталог')}
            </Link>
            <span className={styles.kaddi} data-search-click="kaddi">
              <AskKaddi variant="text" />
            </span>
          </div>
        </div>
        <Mascot pose="search" className={styles.mascot} />
      </div>
    )
  }
  return (
    <section className={styles.results} aria-label={t('Результаты поиска')}>
      <p className={styles.count} aria-live="polite">
        {partial
          ? t('Точно по запросу ничего нет — похожее: {count}', {
              count: positions(items.length, t),
            })
          : t('Найдено: {count}', { count: positions(items.length, t) })}
      </p>
      <Cards items={items} />
      {addons.length > 0 && (
        <>
          <h2 className={styles.group}>{t('Дополнения для {list}', { list: bases.join(', ') })}</h2>
          <Cards items={addons} />
        </>
      )}
    </section>
  )
}
