import type { Fact } from '@/lib/product'
import styles from './ProductFacts.module.css'

/**
 * Главные факты строкой под заголовком — у курсов, где сцены с картинкой нет (замечание
 * владельца 27.10.2026: «у обучения нет картинок»): длительность, направление, формат.
 */
export function ProductFacts({ facts }: { facts: Fact[] }) {
  if (!facts.length) return null
  return (
    <dl className={styles.facts}>
      {facts.map((fact) => (
        <div key={fact.name} className={styles.fact}>
          <dt>{fact.name}</dt>
          <dd>{fact.value}</dd>
        </div>
      ))}
    </dl>
  )
}
