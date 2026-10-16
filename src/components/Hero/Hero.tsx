import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Home } from '@/lib/home'
import { catalogHref } from '@/lib/navigationHrefs'
import { Aurora } from '../Aurora/Aurora'
import { Badge } from '../Badge/Badge'
import { Container } from '../Container/Container'
import { SolutionRequest } from '../SolutionRequest/SolutionRequest'
import { TaskPicker } from '../TaskPicker/TaskPicker'
import styles from './Hero.module.css'

type Props = {
  home: Home
  /** Направления для быстрого выбора в заявке, если консультант выключен. */
  directions: { slug: string; title: string }[]
}

/**
 * Первый экран главной «Подбор по задаче» (решение владельца 16.10.2026): слева плашка, заголовок,
 * подзаголовок, одна главная кнопка (чат с Кадди) и ссылка в каталог; справа карточка
 * «С чего начнём?» — задача своими словами или кнопкой сразу уходит Кадди. На телефоне карточка
 * под текстом. Тексты и задачи — в админке «Главная страница». Внутри баннера медленно
 * переливается сияние (Aurora glow).
 */
export function Hero({ home, directions }: Props) {
  const { hero } = home
  return (
    <section className={styles.hero}>
      <Container>
        <div className={styles.band}>
          <Aurora />
          <div className={styles.content}>
            {home.eyebrow && <Badge tone="onDark">{home.eyebrow}</Badge>}
            <h1 className={styles.title}>{home.title}</h1>
            {hero.lead && <p className={styles.lead}>{hero.lead}</p>}
            <div className={styles.actions}>
              <SolutionRequest
                label={hero.button}
                directions={directions.map(({ slug, title }) => ({ slug, title }))}
                whatsappHref={home.whatsappHref}
              />
              <Link href={catalogHref()} className={styles.link}>
                Открыть каталог
                <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className={styles.picker}>
            <TaskPicker
              title={hero.cardTitle}
              placeholder={hero.placeholder}
              tasks={hero.tasks}
              note={hero.note}
              whatsappHref={home.whatsappHref}
            />
          </div>
        </div>
      </Container>
    </section>
  )
}
