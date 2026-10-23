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
 * госзакупкам» (перенесены из «Акций», замечание владельца 13.10.2026). При прокрутке шаги
 * и карточки съезжаются к своим местам с краёв и снизу, привязанно к прокрутке — блок собирается
 * воедино (владелец 23.10.2026: без размытия, попиксельно).
 */
const stepFrom = [styles.fromStart, styles.fromBelow, styles.fromEnd]

/** Две карточки — слева и справа, одна — снизу. */
function cardFrom(i: number, count: number) {
  if (count < 2) return styles.fromBelow
  return i % 2 === 0 ? styles.fromStart : styles.fromEnd
}

export function ProcessSteps({ steps, cards }: Props) {
  return (
    <div className={styles.stack}>
      <Grid as="ul" span={{ base: 12, md: 4 }}>
        {steps.map((step, i) => {
          const Icon = icons[i % icons.length] ?? MessageSquare
          return (
            <li key={step.title} className={`${styles.step} ${styles.assemble} ${stepFrom[i % 3]}`}>
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
          {cards.map((card, i) => (
            <li
              key={card.title}
              className={[
                styles.card,
                card.dark ? styles.dark : '',
                styles.assemble,
                cardFrom(i, cards.length),
              ]
                .filter(Boolean)
                .join(' ')}
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
