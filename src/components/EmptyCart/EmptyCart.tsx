import { catalogHref } from '@/lib/navigationHrefs'
import { ButtonLink } from '../Button/Button'
import { WhatsappIcon } from '../icons/icons'
import styles from './EmptyCart.module.css'

/** Текст, который уже набран в WhatsApp: клиенту остаётся дописать задачу. */
const HELP_TEXT = 'Здравствуйте! Помогите, пожалуйста, подобрать решение.'

type Props = {
  loading?: boolean
  /** Ссылка на WhatsApp компании; нет — кнопки «Помочь с выбором» нет. */
  whatsappHref?: string | null
}

/**
 * Пустая корзина: объяснение, каталог и «Помочь с выбором» в WhatsApp — не тупик для того, кто
 * не знает, что выбрать. Общая для корзины и оформления.
 * loading — пока корзина читается в браузере: блок того же размера, текст и кнопки скрыты,
 * чтобы подвал не прыгал, когда корзина окажется пустой.
 */
export function EmptyCart({ loading = false, whatsappHref = null }: Props) {
  const reserve = loading ? styles.reserve : undefined
  return (
    <div className={styles.empty} role={loading ? 'status' : undefined}>
      <h2>{loading ? 'Загружаем корзину…' : 'В корзине пока пусто'}</h2>
      <p className={reserve}>
        Выберите решение в каталоге или напишите задачу — инженер подскажет, что подойдёт.
      </p>
      <div className={reserve ? `${styles.actions} ${reserve}` : styles.actions}>
        <ButtonLink href={catalogHref()}>Перейти в каталог</ButtonLink>
        {whatsappHref && (
          <ButtonLink
            href={`${whatsappHref}?text=${encodeURIComponent(HELP_TEXT)}`}
            variant="outline"
            external
          >
            <WhatsappIcon size={20} />
            Помочь с выбором
          </ButtonLink>
        )}
      </div>
    </div>
  )
}
