'use client'

import { CircleHelp } from 'lucide-react'
import { openAssistant } from '@/lib/openAssistant'
import { Button } from '../Button/Button'
import { usePickerContext } from '../PickerProvider/PickerProvider'

/**
 * «Задать вопрос» под заявкой (решение владельца 27.10.2026): открывает чат с Кадди. Знак
 * вопроса понятен и без русского. Консультант выключен — заявка «Консультация».
 */
export function PickerAsk() {
  const { openRequest } = usePickerContext()
  return (
    <Button
      variant="outline"
      block
      onClick={() => {
        if (!openAssistant()) openRequest('consult', 'Задать вопрос')
      }}
    >
      <CircleHelp size={20} strokeWidth={1.75} aria-hidden="true" />
      Задать вопрос
    </Button>
  )
}
