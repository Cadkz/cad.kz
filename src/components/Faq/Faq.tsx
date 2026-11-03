import { Plus } from 'lucide-react'
import { faqLd } from '@/domain/structuredData.mjs'
import { JsonLd } from '../JsonLd/JsonLd'
import styles from './Faq.module.css'

type Item = { question: string; answer: string }

/**
 * Частые вопросы на нативных details: открываются без JavaScript и с клавиатуры. Те же вопросы —
 * разметкой FAQPage для поисковиков (на странице один такой блок).
 *
 * Открыт один вопрос за раз, а под список заранее отведено место под самый длинный ответ
 * (невидимая копия в той же ячейке сетки): блоки ниже и карточка «Не нашли ответ?» не двигаются
 * при открытии и закрытии (замечание владельца 03.11.2026).
 */
export function Faq({ items }: { items: Item[] }) {
  return (
    <div className={styles.frame}>
      <JsonLd data={faqLd(items)} />
      <div className={styles.reserve} aria-hidden="true">
        {items.map((item) => (
          <div key={item.question} className={styles.item}>
            <div className={styles.question}>
              {item.question}
              <Plus size={20} strokeWidth={1.75} className={styles.icon} />
            </div>
          </div>
        ))}
        <div className={styles.answers}>
          {items.map((item) => (
            <p key={item.question} className={styles.answer}>
              {item.answer}
            </p>
          ))}
        </div>
      </div>
      <div className={styles.list}>
        {items.map((item) => (
          <details key={item.question} name="faq" className={styles.item}>
            <summary className={styles.question}>
              {item.question}
              <Plus size={20} strokeWidth={1.75} aria-hidden="true" className={styles.icon} />
            </summary>
            <p className={styles.answer}>{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  )
}
