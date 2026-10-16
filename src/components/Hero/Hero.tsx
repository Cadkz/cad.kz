import { ArrowRight, LayoutGrid } from 'lucide-react'
import Link from 'next/link'
import type { Home } from '@/lib/home'
import { catalogHref } from '@/lib/navigationHrefs'
import { Aurora } from '../Aurora/Aurora'
import { Badge } from '../Badge/Badge'
import { ButtonLink } from '../Button/Button'
import { Container } from '../Container/Container'
import { TaskPicker } from '../TaskPicker/TaskPicker'
import styles from './Hero.module.css'

type Props = { home: Home }

/**
 * Первый экран главной «Подбор по задаче» (решение владельца 16.10.2026): слева плашка, заголовок,
 * подзаголовок и быстрые пути для тех, кому ИИ не нужен, — каталог кнопкой и продление ссылкой;
 * справа единственный вход в разговор с Кадди — карточка с полем и кнопками задач (замечания
 * ChatGPT 16.10: одна точка подбора, без второй кнопки с той же функцией). На телефоне карточка
 * под текстом. Тексты и задачи — в админке «Главная страница». Внутри баннера медленно
 * переливается сияние (Aurora glow).
 */
export function Hero({ home }: Props) {
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
              <ButtonLink href={catalogHref()} variant="light">
                <LayoutGrid size={20} strokeWidth={1.75} aria-hidden="true" />
                Открыть каталог
              </ButtonLink>
              <Link href="/renew" className={styles.link}>
                Продлить лицензию
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
