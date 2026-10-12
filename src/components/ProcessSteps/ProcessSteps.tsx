import type { Home } from '@/lib/home'
import styles from './ProcessSteps.module.css'

/**
 * Шаги работы с клиентом линией: номер в кружке на общей тонкой линии, под ним заголовок
 * и описание. От 960 px шаги в ряд, на телефоне — столбиком, линия идёт сверху вниз.
 * Без карточек и фона: блок — спокойная пауза между акциями и BIM.
 */
export function ProcessSteps({ steps }: { steps: Home['process'] }) {
  return (
    <ol className={styles.steps}>
      {steps.map((step, i) => (
        <li key={step.title} className={styles.step}>
          <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
          <div className={styles.body}>
            <h3 className={styles.title}>{step.title}</h3>
            {step.text && <p className={styles.text}>{step.text}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}
