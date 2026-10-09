import { Mail, Phone } from 'lucide-react'
import type { Contacts } from '@/lib/navigation'
import { WhatsappIcon } from '../icons/icons'
import styles from './AskManager.module.css'

type Props = {
  contacts: Contacts
  title: string
  /** Первая фраза, которая уже будет набрана в чате WhatsApp. */
  message: string
}

/** Блок под текстом страницы: быстро задать вопрос менеджеру в WhatsApp, по телефону или почте. */
export function AskManager({ contacts, title, message }: Props) {
  const phone = contacts.phones[0]
  if (!contacts.whatsappHref && !phone && !contacts.email) return null
  return (
    <section className={styles.box} aria-labelledby="ask-manager-title">
      <h2 id="ask-manager-title" className={styles.title}>
        {title}
      </h2>
      <div className={styles.actions}>
        {contacts.whatsappHref && (
          <a
            href={`${contacts.whatsappHref}?text=${encodeURIComponent(message)}`}
            className={styles.whatsapp}
            target="_blank"
            rel="noreferrer"
          >
            <WhatsappIcon size={20} />
            Написать в WhatsApp
          </a>
        )}
        {phone && (
          <a href={`tel:${phone.tel}`} className={styles.line}>
            <Phone size={16} strokeWidth={1.75} aria-hidden="true" />
            {phone.label}
          </a>
        )}
        {contacts.email && (
          <a href={`mailto:${contacts.email}`} className={styles.line}>
            <Mail size={16} strokeWidth={1.75} aria-hidden="true" />
            {contacts.email}
          </a>
        )}
      </div>
    </section>
  )
}
