import type { Contacts } from '@/lib/navigation'
import { ButtonLink } from '../Button/Button'
import { ContactList } from '../ContactList/ContactList'
import { WhatsappIcon } from '../icons/icons'
import styles from './FaqHelp.module.css'

/** Текст, который уже набран в WhatsApp: клиенту остаётся дописать вопрос. */
const WHATSAPP_TEXT = 'Здравствуйте! У меня вопрос: '

/** Правая колонка у частых вопросов на главной: куда спросить, если ответа в списке нет. */
export function FaqHelp({ contacts }: { contacts: Contacts }) {
  const whatsapp = contacts.whatsappHref
    ? `${contacts.whatsappHref}?text=${encodeURIComponent(WHATSAPP_TEXT)}`
    : null
  return (
    <aside className={styles.box} aria-labelledby="faq-help-title">
      <h3 id="faq-help-title" className={styles.title}>
        Не нашли ответ?
      </h3>
      <p className={styles.text}>
        Спросите менеджера — подскажем по программам, лицензиям и поставке.
      </p>
      {whatsapp && (
        <ButtonLink href={whatsapp} block>
          <WhatsappIcon size={20} />
          Спросить в WhatsApp
        </ButtonLink>
      )}
      <ContactList contacts={contacts} socials={false} whatsapp={false} />
    </aside>
  )
}
