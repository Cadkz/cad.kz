'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAssistant } from '@/lib/useAssistant'
import { AssistantLauncher } from '../AssistantLauncher/AssistantLauncher'
import { AssistantPanel } from '../AssistantPanel/AssistantPanel'

type Props = {
  /** Модель не подключена: Кади честно говорит об этом и ищет по каталогу. */
  demo: boolean
  whatsappHref: string | null
}

/**
 * ИИ-консультант Кади: сам Кади в правом нижнем углу экрана (AssistantLauncher) и окно чата
 * на его месте. Выводится, только когда работает сервис консультанта
 * (src/lib/assistant/provider.ts); окно не всплывает само — его открывает человек.
 * Разговор не теряется при переходе по страницам и закрытии окна.
 */
export function Assistant({ demo, whatsappHref }: Props) {
  const [open, setOpen] = useState(false)
  // Окно выносится в body: так fixed считается от экрана, а не от предка с transform/filter.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const chat = useAssistant()
  const launcher = useRef<HTMLButtonElement>(null)

  const close = useCallback((returnFocus = true) => {
    setOpen(false)
    // Закрыли крестиком или Escape — фокус возвращается на Кади, с которого окно открыли.
    // Кликом мимо окна — остаётся там, куда кликнули (поле поиска, ссылка).
    if (returnFocus) requestAnimationFrame(() => launcher.current?.focus())
  }, [])

  return (
    <>
      <AssistantLauncher
        ref={launcher}
        open={open}
        onClick={() => (open ? close() : setOpen(true))}
      />
      {mounted &&
        open &&
        createPortal(
          <AssistantPanel chat={chat} demo={demo} whatsappHref={whatsappHref} onClose={close} />,
          document.body,
        )}
    </>
  )
}
