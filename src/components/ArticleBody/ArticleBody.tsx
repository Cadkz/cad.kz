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

/** Пункты из старого сайта бывают одинаковыми: ключ — текст и номер повтора. */
function uniqueKeys(items: string[]): [string, string][] {
  const seen = new Map<string, number>()
  return items.map((item) => {
    const count = (seen.get(item) ?? 0) + 1
    seen.set(item, count)
    return [`${item}#${count}`, item]
  })
}

/** Ссылка на файл (PDF, картинка в «Медиа»), а не на страницу сайта. */
const isFile = (href: string) =>
  href.startsWith('/api/media/') || /\.(pdf|jpe?g|png|gif|webp)$/i.test(href)

/**
 * Строка со ссылками: свои страницы — через Link, внешние адреса и файлы открываются в новой
 * вкладке.
 */
function Text({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((part, i) => {
        const key = `${i}-${part.text}`
        if (!part.href) return <span key={key}>{part.text}</span>
        return part.href.startsWith('/') && !isFile(part.href) ? (
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
                {uniqueKeys(block.items).map(([itemKey, item]) => (
                  <li key={itemKey}>
                    <Text text={item} />
                  </li>
                ))}
              </ul>
            )
          case 'note':
            return (
              // Выноска в тексте — примечание, а не отдельная область страницы.
              <div key={key} role="note" className={styles.note}>
                <Text text={block.text} />
              </div>
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
