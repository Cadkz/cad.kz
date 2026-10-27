'use client'

import { Mail, Phone } from 'lucide-react'
import { useState } from 'react'
import type { RequestKind } from '@/domain/siteRequest.mjs'
import type { Contacts } from '@/lib/navigation'
import { requestMessage } from '@/lib/requestMessage'
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
  /** «Нашли дешевле?» под кнопками карточки покупки: свой заголовок и текст, скидка отмечена. */
  cheaper?: boolean
}

/** «Нашли дешевле?»: КП конкурента удобнее всего прислать файлом в WhatsApp. */
const CHEAPER = {
  title: 'Нашли дешевле?',
  intro:
    'Пришлите коммерческое предложение конкурента в WhatsApp — подберём условия не хуже или объясним разницу в комплектации. Или оставьте телефон, менеджер перезвонит.',
  message: 'Нашёл дешевле, пришлю КП конкурента',
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

/**
 * Окно заявки — попап по центру (решение владельца 27.10.2026): сразу форма «имя, телефон,
 * почта по желанию», у запроса цены — галочка «Запросить скидку». Окно широкое и невысокое: имя
 * и телефон в один ряд. Внизу серой полосой во всю ширину — второстепенное: зелёная кнопка
 * WhatsApp с уже набранным составом, почта и телефоны в ряд.
 */
export function RequestDialog(props: Props) {
  const { kind, onClose, pageTitle, lines, choices, quantity, contacts, button, cheaper } = props
  const [place, setPlace] = useState(places[0]?.value ?? '')
  if (!kind) return null
  const note = kind === 'demo' ? `Демонстрация: ${place}` : ''
  const heading = cheaper ? CHEAPER.message : titles[kind]
  const text = `${requestMessage(heading, pageTitle, lines, choices, quantity)}${note ? `\n${note}` : ''}`
  const whatsappLink = contacts.whatsappHref
    ? `${contacts.whatsappHref}?text=${encodeURIComponent(text)}`
    : null
  return (
    <Drawer
      open
      onClose={onClose}
      title={cheaper ? CHEAPER.title : button || titles[kind]}
      side="center"
    >
      <div className={styles.body}>
        <p className={styles.intro}>{cheaper ? CHEAPER.intro : intro[kind]}</p>
        {lines.length > 0 && (
          <RequestChoice title={pageTitle} lines={lines} choices={choices} quantity={quantity} />
        )}
        {cheaper && whatsappLink && (
          // КП конкурента — файл: в WhatsApp его прислать проще всего, поэтому кнопка над формой.
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.whatsapp}
          >
            <WhatsappIcon size={20} />
            Отправить КП в WhatsApp
          </a>
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
          discountChecked={cheaper}
        />
        <div className={styles.direct}>
          <p className={styles.directTitle}>Или свяжитесь сами</p>
          <div className={styles.directRow}>
            {whatsappLink && !cheaper && (
              <a
                href={whatsappLink}
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
