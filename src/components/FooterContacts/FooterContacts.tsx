import { footerSocials } from '@/domain/footerContacts.mjs'
import { getT } from '@/i18n/server'
import type { Contacts } from '@/lib/navigation'
import { socialIcons, socialNames, TelegramIcon, WhatsappIcon } from '../icons/icons'
import styles from './FooterContacts.module.css'

type Props = { contacts: Contacts }

/**
 * Контакты в подвале (аудит 21.10.2026, М5, Г9): два номера цифрами (решение владельца —
 * больше не нужно), почта, адрес и часы; WhatsApp, Telegram и соцсети — строкой значков.
 */
export async function FooterContacts({ contacts }: Props) {
  const t = await getT()
  const socials = footerSocials(contacts.socials, contacts.telegramHref)
  return (
    <div className={styles.contacts}>
      <div className={styles.numbers}>
        {contacts.phones.map((phone) => (
          <a key={phone.tel} href={`tel:${phone.tel}`} className={styles.phone}>
            {phone.label}
          </a>
        ))}
        {contacts.email && (
          <a href={`mailto:${contacts.email}`} className={styles.mail}>
            {contacts.email}
          </a>
        )}
      </div>
      {(contacts.address || contacts.hours) && (
        <p className={styles.place}>
          {contacts.address && <span>{t(contacts.address)}</span>}
          {contacts.hours && <span>{t(contacts.hours)}</span>}
        </p>
      )}
      <div className={styles.icons}>
        {contacts.whatsappHref && (
          <a
            href={contacts.whatsappHref}
            className={styles.icon}
            target="_blank"
            rel="noreferrer"
            aria-label={t('Написать в WhatsApp')}
          >
            <WhatsappIcon size={20} />
          </a>
        )}
        {contacts.telegramHref && (
          <a
            href={contacts.telegramHref}
            className={styles.icon}
            target="_blank"
            rel="noreferrer"
            aria-label={t('Написать в Telegram')}
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
