'use client'

import { Phone } from 'lucide-react'
import { useState } from 'react'
import type { RequestKind } from '@/domain/siteRequest.mjs'
import type { Contacts } from '@/lib/navigation'
import { ButtonLink } from '../Button/Button'
import { CallbackForm } from '../CallbackForm/CallbackForm'
import { Drawer } from '../Drawer/Drawer'
import { WhatsappIcon } from '../icons/icons'
import { RadioChips } from '../RadioChips/RadioChips'
import styles from './RequestDialog.module.css'

export type RequestLine = {
  productId: number
  offerId: string | null
  label: string
  detail: string | null
}

type Props = {
  kind: RequestKind | null
  onClose: () => void
  pageTitle: string
  pageProductId: number
  familySlug: string | null
  quantity: number
  /** Выбор переключателей: срок, редакция. */
  choices: { title: string; value: string }[]
  lines: RequestLine[]
  contacts: Pick<Contacts, 'phones' | 'whatsappHref' | 'hours'>
}

const titles: Record<RequestKind, string> = {
  price: 'Запросить цену',
  renew: 'Продление и обновление',
  help: 'Помочь с выбором',
  quote: 'Получить КП',
}

const intro: Record<RequestKind, string> = {
  price: 'Менеджер пришлёт расчёт на выбранный комплект.',
  renew:
    'Отметьте программы, которые у вас уже есть. Менеджер сам уточнит данные лицензии и подготовит продление или обновление.',
  help: 'Расскажите менеджеру о задачах — он подскажет комплект и редакцию.',
  quote: 'Менеджер подготовит коммерческое предложение на выбранный комплект.',
}

type Way = 'callback' | 'call' | 'whatsapp'
/** WhatsApp первым: так быстрее всего, состав уже набран в сообщении. Звонок — запасной путь. */
const ways = [
  { value: 'whatsapp', label: 'Напишу в WhatsApp' },
  { value: 'callback', label: 'Перезвоните мне' },
  { value: 'call', label: 'Позвоню сам' },
]

/** Текст для WhatsApp и для разговора: страница и выбранное. */
function messageText(
  kind: RequestKind,
  page: string,
  lines: RequestLine[],
  choices: Props['choices'],
  quantity: number,
) {
  const list = lines.map((l) => `— ${l.label}${l.detail ? ` (${l.detail})` : ''}`).join('\n')
  const picked = choices.map((c) => `\n${c.title}: ${c.value}`).join('')
  const count = quantity > 1 ? `\nКоличество: ${quantity}` : ''
  return `Здравствуйте! ${titles[kind]}: ${page}${list ? `\n${list}` : ''}${picked}${count}`
}

/**
 * Окно «Как связаться»: сразу кнопка WhatsApp с уже набранным составом, по выбору — перезвонить
 * (заявка сохраняется на сервере) или позвонить самому (номера и часы работы).
 */
export function RequestDialog(props: Props) {
  const { kind, onClose, pageTitle, lines, choices, quantity, contacts } = props
  const [way, setWay] = useState<Way>(contacts.whatsappHref ? 'whatsapp' : 'callback')
  if (!kind) return null
  const text = messageText(kind, pageTitle, lines, choices, quantity)
  return (
    <Drawer open onClose={onClose} title={titles[kind]}>
      <div className={styles.body}>
        <p className={styles.intro}>{intro[kind]}</p>
        {lines.length > 0 && (
          <div className={styles.choice}>
            <p className={styles.label}>{pageTitle}</p>
            <ul className={styles.lines}>
              {lines.map((line) => (
                <li key={`${line.productId}-${line.offerId}`}>
                  {line.label}
                  {line.detail && <span className={styles.detail}> · {line.detail}</span>}
                </li>
              ))}
            </ul>
            {choices.map((choice) => (
              <p key={choice.title} className={styles.detail}>
                {choice.title}: {choice.value}
              </p>
            ))}
            {quantity > 1 && <p className={styles.detail}>Количество: {quantity}</p>}
          </div>
        )}
        <RadioChips
          legend="Как удобнее связаться"
          name="contact-way"
          value={way}
          options={contacts.whatsappHref ? ways : ways.filter((w) => w.value !== 'whatsapp')}
          onChange={(value) => setWay(value as Way)}
        />
        {way === 'callback' && <CallbackForm {...props} kind={kind} />}
        {way === 'call' && (
          <div className={styles.call}>
            {contacts.phones.map((phone) => (
              <a key={phone.tel} href={`tel:${phone.tel}`} className={styles.phone}>
                <Phone size={20} strokeWidth={1.75} aria-hidden="true" />
                {phone.label}
              </a>
            ))}
            {contacts.hours && <p className={styles.detail}>{contacts.hours}</p>}
            <p className={styles.detail}>
              Назовите менеджеру программу и что нужно: {titles[kind].toLowerCase()}.
            </p>
          </div>
        )}
        {way === 'whatsapp' && contacts.whatsappHref && (
          <ButtonLink
            href={`${contacts.whatsappHref}?text=${encodeURIComponent(text)}`}
            external
            block
          >
            <WhatsappIcon size={20} />
            Открыть WhatsApp
          </ButtonLink>
        )}
      </div>
    </Drawer>
  )
}
