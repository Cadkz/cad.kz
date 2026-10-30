'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ASSISTANT_STATE_EVENT,
  type AssistantStateDetail,
  OPEN_ASSISTANT_EVENT,
  type OpenAssistantDetail,
} from '@/lib/openAssistant'
import { useAssistant } from '@/lib/useAssistant'
import { AssistantLauncher } from '../AssistantLauncher/AssistantLauncher'
import { AssistantPanel } from '../AssistantPanel/AssistantPanel'
import { HeaderAction } from '../HeaderAction/HeaderAction'
import { Mascot } from '../Mascot/Mascot'

/** Открыли чат GRUMPY_OPENS раз за GRUMPY_WINDOW_MS — Кадди недоволен ещё GRUMPY_MS. */
const GRUMPY_OPENS = 3
const GRUMPY_WINDOW_MS = 8000
const GRUMPY_MS = 6000

type Props = {
  /** Модель не подключена: Кадди честно говорит об этом и ищет по каталогу. */
  demo: boolean
  whatsappHref: string | null
}

/**
 * ИИ-консультант Кадди. Вход: на телефоне — голова Кадди в шапке (ничего на странице не
 * закрывает), от 640 px — Кадди-буханка в правом нижнем углу (AssistantLauncher). Окно чата
 * открывается на месте буханки, на телефоне — на весь экран. Выводится, только когда работает
 * сервис консультанта (src/lib/assistant/provider.ts); окно само не открывается — его открывает
 * человек (кнопкой или из содержимого страницы — openAssistant() в src/lib/openAssistant.ts).
 * Разговор не теряется при переходе по страницам и закрытии окна.
 */
export function Assistant({ demo, whatsappHref }: Props) {
  const [open, setOpen] = useState(false)
  // Окно в разметке: после закрытия ещё доигрывает сворачивание, потом убирается.
  const [present, setPresent] = useState(false)
  const [grumpy, setGrumpy] = useState(false)
  // Буханка и окно выносятся в body: внутри шапки (backdrop-filter) fixed считался бы от неё.
  const [mounted, setMounted] = useState(false)
  const chat = useAssistant(open)
  const opener = useRef<HTMLElement | null>(null)
  const opens = useRef<number[]>([])
  const calm = useRef<ReturnType<typeof setTimeout>>(undefined)
  // Свежая функция отправки для обработчика события (он подписан один раз).
  const send = useRef(chat.send)
  send.current = chat.send

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
    setPresent(true)
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
    // Чат на сайте есть — кнопки «Спросить Кадди» в содержимом страниц открывают его.
    root.dataset.assistant = 'on'
    // С событием может прийти вопрос (например, запрос из поиска) — он сразу уходит Кадди.
    const onOpen = (event: Event) => {
      show(document.activeElement instanceof HTMLElement ? document.activeElement : null)
      const { message } = (event as CustomEvent<OpenAssistantDetail>).detail ?? {}
      if (message) void send.current(message)
    }
    window.addEventListener(OPEN_ASSISTANT_EVENT, onOpen)
    return () => {
      delete root.dataset.assistant
      window.removeEventListener(OPEN_ASSISTANT_EVENT, onOpen)
      clearTimeout(calm.current)
    }
  }, [show])

  // Открыто ли окно — для частей страницы, которые не должны показывать второе поле ввода
  // (карточка «Подбор по задаче» на главной сворачивается, пока идёт разговор).
  useEffect(() => {
    const root = document.documentElement
    if (open) root.dataset.assistantOpen = 'true'
    else delete root.dataset.assistantOpen
    window.dispatchEvent(
      new CustomEvent<AssistantStateDetail>(ASSISTANT_STATE_EVENT, { detail: { open } }),
    )
  }, [open])

  // Менеджер ответил из открытой линии, а окно закрыто — от 640 px открываем его сами, чтобы ответ
  // не потерялся. На телефоне окно на весь экран: не перекрываем страницу, ответ ждёт в чате.
  const managers = chat.messages.filter((m) => m.role === 'manager').length
  const seenManagers = useRef<number | null>(null)
  useEffect(() => {
    const before = seenManagers.current
    seenManagers.current = managers
    if (before === null || managers <= before || open) return
    if (window.matchMedia('(min-width: 640px)').matches) show(null)
  }, [managers, open, show])

  const hide = useCallback(() => setPresent(false), [])

  const toggle = (from: HTMLElement) => (open ? close() : show(from))

  return (
    <>
      <HeaderAction
        hideFrom="sm"
        icon={<Mascot pose="head" size="head" eager hover={false} />}
        ariaLabel="Спросить Кадди — ИИ-консультант CAD.kz"
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
            {present && (
              <AssistantPanel
                chat={chat}
                demo={demo}
                grumpy={grumpy}
                whatsappHref={whatsappHref}
                closing={!open}
                onClose={close}
                onClosed={hide}
              />
            )}
          </>,
          document.body,
        )}
    </>
  )
}
