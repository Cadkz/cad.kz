'use client'

import { Mail, Phone } from 'lucide-react'
import { useState } from 'react'
import type { RequestKind } from '@/domain/siteRequest.mjs'
import type { Contacts } from '@/lib/navigation'
import { CallbackForm } from '../CallbackForm/CallbackForm'
import { Drawer } from '../Drawer/Drawer'
import { WhatsappIcon } from '../icons/icons'
import { RadioChips } from '../RadioChips/RadioChips'
import { RequestChoice } from './RequestChoice'
import styles from './RequestDialog.module.css'

export type RequestLine = {
  productId: number
  offerId: string | null
  label: string
  detail: string | null
}

type Props = {
  kind: RequestKind | null
  /** Подпись нажатой кнопки — уходит менеджеру вместе с заявкой. */
  button?: string
  onClose: () => void
  pageTitle: string
  pageProductId: number
  familySlug: string | null
  quantity: number
  /** Выбор переключателей: срок, редакция. */
  choices: { title: string; value: string }[]
  lines: RequestLine[]
  contacts: Pick<Contacts, 'phones' | 'whatsappHref' | 'email'>
}

const titles: Record<RequestKind, string> = {
  price: 'Запросить цену',
  renew: 'Продление и обновление',
  help: 'Помочь с выбором',
  quote: 'Получить КП',
  demo: 'Записаться на демонстрацию',
  consult: 'Консультация специалиста',
  signup: 'Записаться',
}

const intro: Record<RequestKind, string> = {
  price: 'Менеджер пришлёт расчёт на выбранный комплект.',
  renew:
    'Отметьте программы, которые у вас уже есть. Менеджер сам уточнит данные лицензии и подготовит продление или обновление.',
  help: 'Расскажите менеджеру о задачах — он подскажет комплект и редакцию.',
  quote: 'Менеджер подготовит коммерческое предложение на выбранный комплект.',
  demo: 'Покажем оборудование в работе на ваших задачах. Менеджер договорится о дне и времени.',
  consult: 'Специалист ответит на вопросы о программе, составе и обновлениях.',
  signup: 'Менеджер уточнит даты, формат и пришлёт счёт.',
}

/** Где показать оборудование: уходит менеджеру первой строкой комментария. */
const places = [
  { value: 'в офисе CAD.kz', label: 'В офисе CAD.kz' },
  { value: 'с выездом к нам', label: 'С выездом к нам' },
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
 * Окно заявки — попап по центру (решение владельца 27.10.2026): сразу форма «имя, телефон,
 * почта по желанию», у запроса цены — галочка «Запросить скидку». Окно широкое и невысокое: имя
 * и телефон в один ряд. Внизу серой полосой во всю ширину — второстепенное: зелёная кнопка
 * WhatsApp с уже набранным составом, почта и телефоны в ряд.
 */
export function RequestDialog(props: Props) {
  const { kind, onClose, pageTitle, lines, choices, quantity, contacts, button } = props
  const [place, setPlace] = useState(places[0]?.value ?? '')
  if (!kind) return null
  const note = kind === 'demo' ? `Демонстрация: ${place}` : ''
  const text = `${messageText(kind, pageTitle, lines, choices, quantity)}${note ? `\n${note}` : ''}`
  return (
    <Drawer open onClose={onClose} title={button || titles[kind]} side="center">
      <div className={styles.body}>
        <p className={styles.intro}>{intro[kind]}</p>
        {lines.length > 0 && (
          <RequestChoice title={pageTitle} lines={lines} choices={choices} quantity={quantity} />
        )}
        {kind === 'demo' && (
          <RadioChips
            legend="Где показать"
            name="demo-place"
            value={place}
            options={places}
            onChange={setPlace}
          />
        )}
        <CallbackForm
          {...props}
          kind={kind}
          note={note}
          discount={kind === 'price' || kind === 'quote'}
        />
        <div className={styles.direct}>
          <p className={styles.directTitle}>Или свяжитесь сами</p>
          <div className={styles.directRow}>
            {contacts.whatsappHref && (
              <a
                href={`${contacts.whatsappHref}?text=${encodeURIComponent(text)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.whatsapp}
              >
                <WhatsappIcon size={20} />
                WhatsApp
              </a>
            )}
            {contacts.email && (
              <a href={`mailto:${contacts.email}`} className={styles.phone}>
                <Mail size={16} strokeWidth={1.75} aria-hidden="true" />
                {contacts.email}
              </a>
            )}
            {contacts.phones.map((phone) => (
              <a key={phone.tel} href={`tel:${phone.tel}`} className={styles.phone}>
                <Phone size={16} strokeWidth={1.75} aria-hidden="true" />
                {phone.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  )
}
