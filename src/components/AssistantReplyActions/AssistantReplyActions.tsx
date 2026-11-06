'use client'

import { useT } from '@/components/LangProvider/LangProvider'
import type { HandoffPrefill } from '@/lib/useAssistant'
import { Button, ButtonLink } from '../Button/Button'
import { WhatsappIcon } from '../icons/icons'

type Props = {
  /** Кадди подготовил передачу менеджеру — кнопка открывает форму с собранным. */
  handoff?: HandoffPrefill
  /** Ссылка WhatsApp с готовым текстом расчёта — под ответом с ценой. */
  whatsapp?: string | null
  onHandoff: (prefill?: HandoffPrefill) => void
}

/**
 * Кнопки под ответом Кадди (аудит 21.10.2026): форма для менеджера вместо вопросов «как к вам
 * обращаться?» и «подскажите телефон» (Ка3) и «Прислать расчёт в WhatsApp» под ценой вместо
 * фразы с вопросом об имени (Ка4). Обёртку с отступами даёт лента разговора.
 */
export function AssistantReplyActions({ handoff, whatsapp, onHandoff }: Props) {
  const t = useT()
  return (
    <>
      {handoff && (
        <Button size="sm" onClick={() => onHandoff(handoff)}>
          {handoff.name && handoff.phone
            ? t('Проверить и передать менеджеру')
            : t('Оставить контакты менеджеру')}
        </Button>
      )}
      {whatsapp && (
        <ButtonLink href={whatsapp} variant="outline" size="sm" external>
          <WhatsappIcon size={16} />
          {t('Прислать расчёт в WhatsApp')}
        </ButtonLink>
      )}
    </>
  )
}
