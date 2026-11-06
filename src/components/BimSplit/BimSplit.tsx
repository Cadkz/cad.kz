import type { BimBlock } from '@/lib/bimPage'
import { Container } from '../Container/Container'
import { Reveal } from '../Reveal/Reveal'
import styles from './BimSplit.module.css'

type Props = {
  block: BimBlock
  id: string
  /** card — белая карточка с рамкой («Как мы помогаем»), plain — без подложки. */
  tone?: 'plain' | 'card'
}

/** Блок страницы BIM: слева надпись и заголовок (4 колонки), справа абзацы (8 колонок).
 *  Проявляется при прокрутке (Reveal). */
export function BimSplit({ block, id, tone = 'plain' }: Props) {
  if (!block.title || !block.text.length) return null
  const titleId = `${id}-title`
  return (
    <section className={styles.section} aria-labelledby={titleId}>
      <Container>
        <Reveal className={`${styles.grid} ${styles[tone]}`}>
          <div className={styles.head}>
            {block.eyebrow && <p className={styles.eyebrow}>{block.eyebrow}</p>}
            <h2 id={titleId} className={styles.title}>
              {block.title}
            </h2>
          </div>
          <div className={styles.text}>
            {block.text.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
