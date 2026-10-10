import { Mail } from 'lucide-react'
import type { Contacts } from '@/lib/navigation'
import { socialIcons, socialNames, TelegramIcon, WhatsappIcon } from '../icons/icons'
import styles from './ContactList.module.css'

/**
 * whatsapp = false — строку WhatsApp не показывать: рядом уже есть своя кнопка WhatsApp.
 * onDark — светлый текст на тёмном фоне (подвал).
 */
type Props = { contacts: Contacts; socials?: boolean; whatsapp?: boolean; onDark?: boolean }

/** Телефоны, мессенджеры и соцсети из настроек CMS. */
export function ContactList({ contacts, socials = true, whatsapp = true, onDark = false }: Props) {
  return (
    <div className={onDark ? `${styles.list} ${styles.onDark}` : styles.list}>
      {contacts.phones.map((phone) => (
        <a key={phone.tel} href={`tel:${phone.tel}`} className={styles.phone}>
          {phone.label}
        </a>
      ))}
      {whatsapp && contacts.whatsappHref && (
        <a href={contacts.whatsappHref} className={styles.line} target="_blank" rel="noreferrer">
          <WhatsappIcon size={16} />
          Написать в WhatsApp
        </a>
      )}
      {contacts.telegramHref && (
        <a href={contacts.telegramHref} className={styles.line} target="_blank" rel="noreferrer">
          <TelegramIcon size={16} />
          Написать в Telegram
        </a>
      )}
      {contacts.email && (
        <a href={`mailto:${contacts.email}`} className={styles.line}>
          <Mail size={16} strokeWidth={1.75} aria-hidden="true" />
          {contacts.email}
        </a>
      )}
      {socials && contacts.socials.length > 0 && (
        <div className={styles.socials}>
          {contacts.socials.map(({ network, url }) => {
            const key = network as keyof typeof socialIcons
            const Icon = socialIcons[key]
            return Icon ? (
              <a
                key={url}
                href={url}
                className={styles.social}
                target="_blank"
                rel="noreferrer"
                aria-label={socialNames[key]}
              >
                <Icon size={20} />
              </a>
            ) : null
          })}
        </div>
      )}
    </div>
  )
}
