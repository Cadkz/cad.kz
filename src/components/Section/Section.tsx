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
  /** Мягкое пятно света за блоком слева или справа — отделяет блок на светлом фоне. */
  glow?: 'left' | 'right'
  children: ReactNode
}

const glows = { left: styles.glowLeft, right: styles.glowRight }

/**
 * Секция страницы: штрих-акцент, заголовок h2, подзаголовок, ссылка «Все …» и содержимое
 * в рамке сайта. Штрих над заголовком прорисовывается, когда секция входит в экран.
 */
export function Section({ title, sub, action, id, tone = 'plain', glow, children }: Props) {
  const headingId = id ? `${id}-title` : undefined
  const classes = [styles.section, styles[tone], glow && glows[glow]]
  return (
    <section id={id} className={classes.filter(Boolean).join(' ')} aria-labelledby={headingId}>
      <Container>
        <div className={styles.head}>
          <div className={styles.text}>
            <h2 id={headingId}>{title}</h2>
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
