import { MessageCircle } from 'lucide-react'
import type { Home } from '@/lib/home'
import { catalogHref } from '@/lib/navigationHrefs'
import { Badge } from '../Badge/Badge'
import { BannerArt } from '../BannerArt/BannerArt'
import { ButtonLink } from '../Button/Button'
import { Container } from '../Container/Container'
import { SolutionRequest } from '../SolutionRequest/SolutionRequest'
import styles from './Hero.module.css'

/** Текст, который уже набран в WhatsApp: клиенту остаётся дописать задачу. */
const WHATSAPP_TEXT = 'Здравствуйте! Помогите подобрать программы. Моя задача: '

type Props = {
  home: Home
  /** Направления для быстрого выбора в заявке «Подобрать решение». */
  directions: { slug: string; title: string }[]
}

/**
 * Первый экран главной: плашка, заголовок и три действия — написать задачу в WhatsApp,
 * оставить короткую заявку «Подобрать решение» или открыть каталог.
 * Акции и предложения — ниже, отдельным блоком (PromoBand).
 */
export function Hero({ home, directions }: Props) {
  const whatsapp = home.whatsappHref
    ? `${home.whatsappHref}?text=${encodeURIComponent(WHATSAPP_TEXT)}`
    : null
  return (
    <section className={styles.hero}>
      <Container>
        <div className={styles.band}>
          <BannerArt name="frame" className={styles.art} />
          <div className={styles.content}>
            {home.eyebrow && <Badge tone="onDark">{home.eyebrow}</Badge>}
            <h1 className={styles.title}>{home.title}</h1>
            <p className={styles.lead}>
              Опишите задачу — менеджер подберёт комплект и пришлёт коммерческое предложение. Или
              выберите сами в каталоге.
            </p>
            <div className={styles.actions}>
              {whatsapp && (
                <ButtonLink href={whatsapp} variant="light">
                  <MessageCircle size={20} strokeWidth={1.75} aria-hidden="true" />
                  Написать задачу в WhatsApp
                </ButtonLink>
              )}
              <SolutionRequest
                directions={directions.map(({ slug, title }) => ({ slug, title }))}
                whatsappHref={whatsapp}
              />
              <ButtonLink href={catalogHref()} variant="ghostDark">
                Перейти в каталог
              </ButtonLink>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
