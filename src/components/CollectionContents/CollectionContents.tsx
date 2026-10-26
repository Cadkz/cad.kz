import { ArrowUpRight, Check } from 'lucide-react'
import Link from 'next/link'
import { ProductSection } from '../ProductSection/ProductSection'
import styles from './CollectionContents.module.css'

type Props = {
  lead: string
  benefit: string
  contents: { name: string; href: string | null }[]
}

/**
 * «Что входит в коллекцию» на странице коллекции или комплекта (пробная ветка
 * redesign/catalog-v2): зачем она, список программ — со ссылкой, если у программы есть своя
 * страница, — и чем выгоднее покупки по отдельности. Состав — src/domain/catalogKinds.mjs.
 */
export function CollectionContents({ lead, benefit, contents }: Props) {
  return (
    <ProductSection title="Что входит" id="contents" sub={lead}>
      <ul className={styles.list}>
        {contents.map((entry) => (
          <li key={entry.name} className={styles.item}>
            <Check size={16} strokeWidth={1.75} aria-hidden="true" className={styles.check} />
            {entry.href ? (
              <Link href={entry.href} className={styles.link}>
                {entry.name}
                <ArrowUpRight size={16} strokeWidth={1.75} aria-hidden="true" />
              </Link>
            ) : (
              <span>{entry.name}</span>
            )}
          </li>
        ))}
      </ul>
      <p className={styles.benefit}>{benefit}</p>
    </ProductSection>
  )
}
