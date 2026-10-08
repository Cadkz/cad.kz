import { ButtonLink } from '../Button/Button'
import { WhatsappIcon } from '../icons/icons'
import styles from './BuyBox.module.css'

type Props = {
  priceFrom: string | null
  several: boolean
  whatsappHref: string | null
  productTitle: string
}

/** Блок покупки: цена самой доступной комплектации, переход к конфигуратору и вопрос в WhatsApp. */
export function BuyBox({ priceFrom, several, whatsappHref, productTitle }: Props) {
  const question = whatsappHref
    ? `${whatsappHref}?text=${encodeURIComponent(`Здравствуйте! Вопрос по ${productTitle}`)}`
    : null
  return (
    <div className={styles.box}>
      <p className={styles.label}>{several ? 'Цена от' : 'Цена'}</p>
      <p className={styles.price}>{priceFrom ?? 'По запросу'}</p>
      <p className={styles.note}>
        С НДС. Итог зависит от комплектации и количества — его считает сервер.
      </p>
      <ButtonLink href="#config" block>
        {several ? 'Выбрать комплектацию' : 'Перейти к покупке'}
      </ButtonLink>
      {question && (
        <ButtonLink href={question} variant="outline" block external>
          <WhatsappIcon size={20} />
          Задать вопрос
        </ButtonLink>
      )}
    </div>
  )
}
