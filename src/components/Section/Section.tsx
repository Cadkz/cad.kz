import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Container } from '../Container/Container'
import styles from './Section.module.css'

type Props = {
  title: string
  sub?: string
  action?: { href: string; label: string }
  id?: string
  /** tint — голубая подложка во всю ширину экрана с фирменным узором. */
  tone?: 'plain' | 'tint'
  /** Только от 960 px: на телефоне и планшете секции нет (каталог на главной, решение владельца 21.10.2026). */
  desktopOnly?: boolean
  /** Без появления при прокрутке: заголовок и ссылка стоят на месте («Новости и акции», «Частые вопросы» — решение владельца 23.10.2026). */
  still?: boolean
  children: ReactNode
}

/**
 * Секция страницы: заголовок h2, подзаголовок, ссылка «Все …» и содержимое в рамке сайта.
 * Штриха над заголовком нет (решение владельца 13.10.2026: лишний декор). Заголовок, когда
 * вошёл в экран, поднимается из-под невидимой маски, ссылка справа проявляется чуть позже
 * (RevealObserver, 23.10.2026); у секций still — без движения.
 */
export function Section({
  title,
  sub,
  action,
  id,
  tone = 'plain',
  desktopOnly = false,
  still = false,
  children,
}: Props) {
  const headingId = id ? `${id}-title` : undefined
  const classes = [styles.section, styles[tone], desktopOnly ? styles.desktopOnly : '']
  return (
    <section id={id} className={classes.filter(Boolean).join(' ')} aria-labelledby={headingId}>
      <Container>
        <div className={styles.head} data-reveal={still ? undefined : ''}>
          <div className={styles.text}>
            <h2 id={headingId} className={styles.title}>
              <span className={styles.titleLine}>{title}</span>
            </h2>
            {sub && <p className={styles.sub}>{sub}</p>}
          </div>
          {action && (
            <Link href={action.href} className={styles.action}>
              {action.label}
              <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
            </Link>
          )}
        </div>
        {children}
      </Container>
    </section>
  )
}
