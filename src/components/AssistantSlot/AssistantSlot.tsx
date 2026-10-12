import { assistantMode } from '@/lib/assistant/provider'
import { Assistant } from '../Assistant/Assistant'

/**
 * Кади-консультант (голова в шапке на телефоне, буханка в углу от 640 px) — только когда работает сервис консультанта (модель подключена или
 * демо-режим с честной пометкой). Выключен — ни кнопки, ни окна.
 */
export function AssistantSlot({ whatsappHref }: { whatsappHref: string | null }) {
  const mode = assistantMode()
  if (!mode) return null
  return <Assistant demo={mode === 'demo'} whatsappHref={whatsappHref} />
}
