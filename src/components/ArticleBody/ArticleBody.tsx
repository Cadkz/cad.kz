import type { Block } from '@/lib/richText'
import styles from './ArticleBody.module.css'

/** Текст статьи: абзацы, подзаголовки с якорями для оглавления, списки, выноски. */
export function ArticleBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className={styles.body}>
      {blocks.map((block, i) => {
        const key = `${block.type}-${i}`
        switch (block.type) {
          case 'heading':
            return (
              <h2 key={key} id={block.id} className={styles.heading}>
                {block.text}
              </h2>
            )
          case 'list':
            return (
              <ul key={key} className={styles.list}>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )
          case 'note':
            return (
              <aside key={key} className={styles.note}>
                {block.text}
              </aside>
            )
          default:
            return <p key={key}>{block.text}</p>
        }
      })}
    </div>
  )
}
