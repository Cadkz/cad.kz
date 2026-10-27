'use client'

import { BadgePercent } from 'lucide-react'
import { requestMessage } from '@/lib/requestMessage'
import { WhatsappIcon } from '../icons/icons'
import { usePickerContext } from '../PickerProvider/PickerProvider'
import styles from './PickerDirect.module.css'

/**
 * Две тихие ссылки под кнопками карточки покупки (решение владельца 27.10.2026): «WhatsApp» —
 * сообщение с уже набранным составом выбора, «Нашли дешевле?» — окно заявки со скидкой, где
 * КП конкурента можно прислать в WhatsApp. Баннер «Нашли дешевле» на главной остаётся. У услуг
 * и курсов «Нашли дешевле?» нет: сравнивать там нечего.
 */
export function PickerDirect() {
  const { meta, quantity, requestLines, requestChoices, openRequest } = usePickerContext()
  const whatsapp = meta.contacts.whatsappHref
  const cheaper = meta.scenario !== 'service'
  if (!whatsapp && !cheaper) return null
  const text = requestMessage(
    'Интересует',
    meta.productTitle,
    requestLines.filter((line) => line.label !== meta.productTitle),
    requestChoices,
    quantity,
  )
  return (
    <div className={styles.row}>
      {whatsapp && (
        <a
          href={`${whatsapp}?text=${encodeURIComponent(text)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          <WhatsappIcon size={16} className={styles.whatsapp} />
          WhatsApp
        </a>
      )}
      {cheaper && (
        <button
          type="button"
          className={styles.link}
          onClick={() => openRequest('price', 'Нашли дешевле?', true)}
        >
          <BadgePercent size={16} strokeWidth={1.75} aria-hidden="true" />
          Нашли дешевле?
        </button>
      )}
    </div>
  )
}
