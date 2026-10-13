import { Phone } from 'lucide-react'
import { type Contacts, mobilePhone } from '@/lib/navigation'
import { AskKaddi } from '../AskKaddi/AskKaddi'
import { WhatsappIcon } from '../icons/icons'
import { Mascot, type MascotPose } from '../Mascot/Mascot'
import styles from './AskManager.module.css'

type Props = {
  contacts: Contacts
  title: string
  /** Реплика кошки: коротко, по-дружески, о себе без рода. */
  phrase: string
  /** Первая фраза, которая уже будет набрана в чате WhatsApp. */
  message: string
  pose?: MascotPose
  /** aside — узкая правая колонка (продление): всё столбиком, кошка над текстом. */
  layout?: 'wide' | 'aside'
}

/**
 * «Вопросы по покупке / доставке / продлению» (13.10.2026): Кадди с репликой, кнопка чата,
 * WhatsApp, телефоны (мобильный первым) и почта обычным текстом. Отдельной карточки контактов
 * на этих страницах больше нет — она дублировала шапку и подвал.
 */
export function AskManager({
  contacts,
  title,
  phrase,
  message,
  pose = 'neutral',
  layout = 'wide',
}: Props) {
  const mobile = mobilePhone(contacts.phones)
  const phones = mobile
    ? [mobile, ...contacts.phones.filter((phone) => phone.tel !== mobile.tel)]
    : contacts.phones
  const titleId = `ask-${layout}-title`
  return (
    <section className={`${styles.box} ${styles[layout]}`} aria-labelledby={titleId}>
      {/* В узкой колонке кошка справа вверху, текст её обтекает. */}
      {layout === 'aside' && <Mascot pose={pose} size="xs" className={styles.mascot} />}
      <div className={styles.text}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <p className={styles.phrase}>{phrase}</p>
        <div className={styles.actions}>
          <AskKaddi size="sm" variant="outline" />
          {contacts.whatsappHref && (
            <a
              href={`${contacts.whatsappHref}?text=${encodeURIComponent(message)}`}
              className={styles.whatsapp}
              target="_blank"
              rel="noreferrer"
            >
              <WhatsappIcon size={20} />
              WhatsApp
            </a>
          )}
        </div>
        {(phones.length > 0 || contacts.email) && (
          <ul className={styles.lines}>
            {phones.map((phone) => (
              <li key={phone.tel}>
                <a href={`tel:${phone.tel}`} className={styles.phone}>
                  <Phone size={16} strokeWidth={1.75} aria-hidden="true" />
                  {phone.label}
                </a>
              </li>
            ))}
            {contacts.email && <li className={styles.email}>{contacts.email}</li>}
          </ul>
        )}
      </div>
      {layout === 'wide' && <Mascot pose={pose} size="sm" className={styles.mascot} />}
    </section>
  )
}
