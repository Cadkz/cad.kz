import Link from 'next/link'
import { parseInline } from '@/lib/richText'
import styles from './InlineText.module.css'

const EMAIL = /^\s*[^\s@]+@[^\s@]+\.[^\s@]+\s*$/

/** Ссылка на файл (PDF, картинка в «Медиа»), а не на страницу сайта. */
const isFile = (href: string) =>
  href.startsWith('/api/media/') || /\.(pdf|jpe?g|png|gif|webp)$/i.test(href)

/**
 * Строка текста со ссылками «[текст](адрес)»: свои страницы — через Link, внешние адреса
 * и файлы открываются в новой вкладке.
 */
export function InlineText({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((part, i) => {
        const key = `${i}-${part.text}`
        // Адрес почты — обычным текстом, без ссылки (решение владельца 13.10.2026).
        if (!part.href || EMAIL.test(part.text)) return <span key={key}>{part.text}</span>
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
