import { Container } from '../Container/Container'
import styles from './BimProof.module.css'

type Props = { items: { title: string; text: string | null }[]; label: string }

/** Строка опыта под баннером BIM: три факта через тонкие разделители. */
export function BimProof({ items, label }: Props) {
  if (!items.length) return null
  return (
    <Container>
      <ul className={styles.list} aria-label={label}>
        {items.map((item) => (
          <li key={item.title} className={styles.item}>
            <strong className={styles.title}>{item.title}</strong>
            {item.text && <span className={styles.text}>{item.text}</span>}
          </li>
        ))}
      </ul>
    </Container>
  )
}
