import { Mail } from 'lucide-react'
import type { Contacts } from '@/lib/navigation'
import { socialIcons, socialNames, WhatsappIcon } from '../icons/icons'
import styles from './ContactList.module.css'

type Props = { contacts: Contacts; socials?: boolean }

/** Телефоны, мессенджеры и соцсети из настроек CMS. */
export function ContactList({ contacts, socials = true }: Props) {
  return (
    <div className={styles.list}>
      {contacts.phones.map((phone) => (
        <a key={phone.tel} href={`tel:${phone.tel}`} className={styles.phone}>
          {phone.label}
        </a>
      ))}
      {contacts.whatsappHref && (
        <a href={contacts.whatsappHref} className={styles.line} target="_blank" rel="noreferrer">
          <WhatsappIcon size={16} />
          Написать в WhatsApp
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
