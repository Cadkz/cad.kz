'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { OPEN_ASSISTANT_EVENT } from '@/lib/openAssistant'
import { useAssistant } from '@/lib/useAssistant'
import { AssistantLauncher } from '../AssistantLauncher/AssistantLauncher'
import { AssistantPanel } from '../AssistantPanel/AssistantPanel'
import { HeaderAction } from '../HeaderAction/HeaderAction'
import { Mascot } from '../Mascot/Mascot'

/** Открыли чат GRUMPY_OPENS раз за GRUMPY_WINDOW_MS — Юки недоволен ещё GRUMPY_MS. */
const GRUMPY_OPENS = 3
const GRUMPY_WINDOW_MS = 8000
const GRUMPY_MS = 6000

type Props = {
  /** Модель не подключена: Юки честно говорит об этом и ищет по каталогу. */
  demo: boolean
  whatsappHref: string | null
}

/**
 * ИИ-консультант Юки. Вход: на телефоне — голова Юки в шапке (ничего на странице не
 * закрывает), от 640 px — Юки-буханка в правом нижнем углу (AssistantLauncher). Окно чата
 * открывается на месте буханки, на телефоне — на весь экран. Выводится, только когда работает
 * сервис консультанта (src/lib/assistant/provider.ts); окно само не открывается — его открывает
 * человек (кнопкой или из содержимого страницы — openAssistant() в src/lib/openAssistant.ts).
 * Разговор не теряется при переходе по страницам и закрытии окна.
 */
export function Assistant({ demo, whatsappHref }: Props) {
  const [open, setOpen] = useState(false)
  const [grumpy, setGrumpy] = useState(false)
  // Буханка и окно выносятся в body: внутри шапки (backdrop-filter) fixed считался бы от неё.
  const [mounted, setMounted] = useState(false)
  const chat = useAssistant()
  const opener = useRef<HTMLElement | null>(null)
  const opens = useRef<number[]>([])
  const calm = useRef<ReturnType<typeof setTimeout>>(undefined)

  const show = useCallback((from: HTMLElement | null) => {
    opener.current = from
    const now = Date.now()
    opens.current = [...opens.current.filter((t) => now - t < GRUMPY_WINDOW_MS), now]
    if (opens.current.length >= GRUMPY_OPENS) {
      opens.current = []
      setGrumpy(true)
      clearTimeout(calm.current)
      calm.current = setTimeout(() => setGrumpy(false), GRUMPY_MS)
    }
    setOpen(true)
  }, [])

  const close = useCallback((returnFocus = true) => {
    setOpen(false)
    // Закрыли крестиком или Escape — фокус возвращается туда, откуда окно открыли.
    // Кликом мимо окна — остаётся там, куда кликнули (поле поиска, ссылка).
    if (returnFocus) requestAnimationFrame(() => opener.current?.focus())
  }, [])

  useEffect(() => {
    setMounted(true)
    const root = document.documentElement
    // Чат на сайте есть — кнопки «Спросить Юки» в содержимом страниц открывают его.
    root.dataset.assistant = 'on'
    const onOpen = () =>
      show(document.activeElement instanceof HTMLElement ? document.activeElement : null)
    window.addEventListener(OPEN_ASSISTANT_EVENT, onOpen)
    return () => {
      delete root.dataset.assistant
      window.removeEventListener(OPEN_ASSISTANT_EVENT, onOpen)
      clearTimeout(calm.current)
    }
  }, [show])

  const toggle = (from: HTMLElement) => (open ? close() : show(from))

  return (
    <>
      <HeaderAction
        hideFrom="sm"
        icon={<Mascot pose="head" size="icon" eager hover={false} />}
        ariaLabel="Спросить Юки — ИИ-консультант CAD.kz"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={(event) => toggle(event.currentTarget)}
      />
      {mounted &&
        createPortal(
          <>
            <AssistantLauncher
              open={open}
              grumpy={grumpy}
              onClick={(event) => toggle(event.currentTarget)}
            />
            {open && (
              <AssistantPanel
                chat={chat}
                demo={demo}
                grumpy={grumpy}
                whatsappHref={whatsappHref}
                onClose={close}
              />
            )}
          </>,
          document.body,
        )}
    </>
  )
}
