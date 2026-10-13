import type { Home } from '@/lib/home'
import { HeroSlider } from '../HeroSlider/HeroSlider'
import { Section } from '../Section/Section'

/**
 * Акции и предложения на главной: только действующие акции (баннер из публикаций типа «Акция»).
 * Карточки «Подберём комплект под ваше ТЗ» и «Работаем по госзакупкам» — не акции, они в блоке
 * «Как мы работаем» (замечание владельца 13.10.2026). Нет действующих акций — блока нет.
 */
export function PromoBand({ home }: { home: Home }) {
  if (!home.slides.length) return null
  return (
    <Section
      id="offers"
      title="Акции и предложения"
      action={{ href: '/news?kind=promotion', label: 'Все акции' }}
    >
      <HeroSlider slides={home.slides} />
    </Section>
  )
}
