import { BookOpen, FileText, MessageSquare } from 'lucide-react'
import type { Home } from '@/lib/home'
import { ButtonLink } from '../Button/Button'
import { Grid } from '../Grid/Grid'
import styles from './ProcessSteps.module.css'

const icons = [MessageSquare, FileText, BookOpen]

type Props = { steps: Home['process']; cards: Home['sideCards'] }

/**
 * «Как мы работаем»: три компактных шага (номер, заголовок, описание в одной карточке) и под
 * ними карточки с действием из админки — «Подберём комплект под ваше ТЗ», «Работаем по
 * госзакупкам» (перенесены из «Акций», замечание владельца 13.10.2026).
 */
export function ProcessSteps({ steps, cards }: Props) {
  return (
    <div className={styles.stack}>
      <Grid as="ul" span={{ base: 12, md: 4 }}>
        {steps.map((step, i) => {
          const Icon = icons[i % icons.length] ?? MessageSquare
          return (
            <li key={step.title} className={styles.step}>
              <span className={styles.num}>{i + 1}</span>
              <div className={styles.body}>
                <h3 className={styles.title}>{step.title}</h3>
                {step.text && <p className={styles.text}>{step.text}</p>}
              </div>
              <Icon size={20} strokeWidth={1.75} aria-hidden="true" className={styles.icon} />
            </li>
          )
        })}
      </Grid>
      {cards.length > 0 && (
        <Grid as="ul" span={{ base: 12, md: cards.length > 1 ? 6 : 12 }}>
          {cards.map((card) => (
            <li
              key={card.title}
              className={card.dark ? `${styles.card} ${styles.dark}` : styles.card}
            >
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{card.title}</h3>
                {card.text && <p className={styles.cardText}>{card.text}</p>}
              </div>
              {card.link && (
                <ButtonLink
                  href={card.link.href}
                  variant={card.dark ? 'light' : 'primary'}
                  size="sm"
                  className={styles.cardAction}
                >
                  {card.link.label}
                </ButtonLink>
              )}
            </li>
          ))}
        </Grid>
      )}
    </div>
  )
}
