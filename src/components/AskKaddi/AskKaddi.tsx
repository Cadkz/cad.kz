'use client'

import { MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useT } from '@/components/LangProvider/LangProvider'
import { openAssistant } from '@/lib/openAssistant'
import { Button } from '../Button/Button'

type Props = {
  label?: string
  variant?: 'outline' | 'text'
  size?: 'md' | 'sm'
  className?: string
}

/**
 * Кнопка «Спросить Кадди» в содержимом страницы (404, поиск без результатов): открывает чат.
 * Показывается только тогда, когда консультант на сайте работает, — пустых кнопок нет.
 */
export function AskKaddi({
  label = 'Спросить Кадди',
  variant = 'outline',
  size = 'md',
  className,
}: Props) {
  const t = useT()
  const [on, setOn] = useState(false)

  useEffect(() => {
    // Консультант отмечает себя на <html> после загрузки — проверяем на следующем кадре.
    const frame = requestAnimationFrame(() =>
      setOn(document.documentElement.dataset.assistant === 'on'),
    )
    return () => cancelAnimationFrame(frame)
  }, [])

  if (!on) return null
  return (
    <Button variant={variant} size={size} className={className} onClick={() => openAssistant()}>
      <MessageCircle size={16} strokeWidth={1.75} aria-hidden="true" />
      {t(label)}
    </Button>
  )
}
