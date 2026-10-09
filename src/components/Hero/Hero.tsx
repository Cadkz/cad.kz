import { MessageCircle } from 'lucide-react'
import type { Home } from '@/lib/home'
import { catalogHref } from '@/lib/navigationHrefs'
import { Badge } from '../Badge/Badge'
import { ButtonLink } from '../Button/Button'
import { Container } from '../Container/Container'
import { FrameDrawing } from '../FrameDrawing/FrameDrawing'
import styles from './Hero.module.css'

/** Текст, который уже набран в WhatsApp: клиенту остаётся дописать задачу. */
const WHATSAPP_TEXT = 'Здравствуйте! Помогите подобрать программы. Моя задача: '

/**
 * Первый экран главной: плашка, заголовок и два действия — написать задачу в WhatsApp
 * или открыть каталог. Акции и предложения — ниже, отдельным блоком (PromoBand).
 */
export function Hero({ home }: { home: Home }) {
  return (
    <section className={styles.hero}>
      <Container>
        <div className={styles.band}>
          <FrameDrawing className={styles.drawing} />
          <div className={styles.content}>
            {home.eyebrow && <Badge tone="onDark">{home.eyebrow}</Badge>}
            <h1 className={styles.title}>{home.title}</h1>
            <p className={styles.lead}>
              Опишите задачу — менеджер подберёт комплект и пришлёт коммерческое предложение. Или
              выберите сами в каталоге.
            </p>
            <div className={styles.actions}>
              {home.whatsappHref && (
                <ButtonLink
                  href={`${home.whatsappHref}?text=${encodeURIComponent(WHATSAPP_TEXT)}`}
                  variant="light"
                >
                  <MessageCircle size={20} strokeWidth={1.75} aria-hidden="true" />
                  Написать задачу в WhatsApp
                </ButtonLink>
              )}
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
