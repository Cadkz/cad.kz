import Image from 'next/image'
import Link from 'next/link'
import type { Picture } from '@/lib/pictures'
import { type Block, parseInline } from '@/lib/richText'
import styles from './ArticleBody.module.css'

type Props = {
  blocks: Block[]
  /** Картинки текста из «Медиа» по адресу. Картинку, которой здесь нет, не выводим. */
  pictures?: Map<string, Picture>
}

/** Строка со ссылками: свои адреса — через Link, внешние открываются в новой вкладке. */
function Text({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((part, i) => {
        const key = `${i}-${part.text}`
        if (!part.href) return <span key={key}>{part.text}</span>
        return part.href.startsWith('/') ? (
          <Link key={key} href={part.href} className={styles.link}>
            {part.text}
          </Link>
        ) : (
          <a key={key} href={part.href} className={styles.link} target="_blank" rel="noopener">
            {part.text}
          </a>
        )
      })}
    </>
  )
}

/** Текст статьи: абзацы, подзаголовки с якорями для оглавления, списки, выноски, картинки. */
export function ArticleBody({ blocks, pictures }: Props) {
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
                  <li key={item}>
                    <Text text={item} />
                  </li>
                ))}
              </ul>
            )
          case 'note':
            return (
              <aside key={key} className={styles.note}>
                <Text text={block.text} />
              </aside>
            )
          case 'image': {
            const picture = pictures?.get(block.src)
            if (!picture) return null
            return (
              <figure key={key} className={styles.figure}>
                <Image
                  src={picture.url}
                  alt={block.alt || picture.alt}
                  width={picture.width}
                  height={picture.height}
                  sizes="(min-width: 960px) 720px, 100vw"
                  className={styles.image}
                />
              </figure>
            )
          }
          default:
            return (
              <p key={key}>
                <Text text={block.text} />
              </p>
            )
        }
      })}
    </div>
  )
}
