import { ChevronDown } from 'lucide-react'
import { type Block, splitPreview } from '@/lib/richText'
import { ArticleBody } from '../ArticleBody/ArticleBody'
import styles from './ProductAbout.module.css'

/**
 * Описание товара: начало сразу, остальное свёрнуто в «Читать полностью» (нативный details:
 * работает без JavaScript, текст виден поисковикам).
 */
export function ProductAbout({ blocks }: { blocks: Block[] }) {
  const { lead, rest } = splitPreview(blocks)
  return (
    <div className={styles.about}>
      <ArticleBody blocks={lead} />
      {rest.length > 0 && (
        <details className={styles.more}>
          <summary className={styles.summary}>
            Читать полностью
            <ChevronDown
              size={16}
              strokeWidth={1.75}
              aria-hidden="true"
              className={styles.chevron}
            />
          </summary>
          <ArticleBody blocks={rest} />
        </details>
      )}
    </div>
  )
}
