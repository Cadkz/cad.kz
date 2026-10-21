import { footerSocials, formatKzPhone } from '@/domain/footerContacts.mjs'
import type { Contacts } from '@/lib/navigation'
import { socialIcons, socialNames, TelegramIcon, WhatsappIcon } from '../icons/icons'
import styles from './FooterContacts.module.css'

type Props = { contacts: Contacts }

/**
 * Контакты в подвале (аудит 21.10.2026, М5, Г9): номера цифрами — городские и WhatsApp,
 * почта, адрес и часы; Telegram и соцсети — одной строкой значков.
 */
export function FooterContacts({ contacts }: Props) {
  const whatsapp = contacts.whatsappHref?.replace('https://wa.me/', '') ?? ''
  const socials = footerSocials(contacts.socials, contacts.telegramHref)
  const place = [contacts.address, contacts.hours].filter(Boolean).join(' · ')
  return (
    <div className={styles.contacts}>
      <div className={styles.numbers}>
        {contacts.phones.map((phone) => (
          <a key={phone.tel} href={`tel:${phone.tel}`} className={styles.phone}>
            {phone.label}
          </a>
        ))}
        {contacts.whatsappHref && (
          <a
            href={contacts.whatsappHref}
            className={styles.phone}
            target="_blank"
            rel="noreferrer"
            aria-label={`Написать в WhatsApp ${formatKzPhone(whatsapp)}`}
          >
            <WhatsappIcon size={16} />
            {formatKzPhone(whatsapp)}
          </a>
        )}
        {contacts.email && (
          <a href={`mailto:${contacts.email}`} className={styles.mail}>
            {contacts.email}
          </a>
        )}
      </div>
      {place && <p className={styles.place}>{place}</p>}
      <div className={styles.icons}>
        {contacts.telegramHref && (
          <a
            href={contacts.telegramHref}
            className={styles.icon}
            target="_blank"
            rel="noreferrer"
            aria-label="Написать в Telegram"
          >
            <TelegramIcon size={20} />
          </a>
        )}
        {socials.map(({ network, url }) => {
          const key = network as keyof typeof socialIcons
          const Icon = socialIcons[key]
          return Icon ? (
            <a
              key={url}
              href={url}
              className={styles.icon}
              target="_blank"
              rel="noreferrer"
              aria-label={socialNames[key]}
            >
              <Icon size={20} />
            </a>
          ) : null
        })}
      </div>
    </div>
  )
}
