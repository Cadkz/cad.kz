'use client'

import { Info, RotateCcw, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import type { useAssistant } from '@/lib/useAssistant'
import { AssistantComposer } from '../AssistantComposer/AssistantComposer'
import { AssistantHandoff } from '../AssistantHandoff/AssistantHandoff'
import { AssistantHeader } from '../AssistantHeader/AssistantHeader'
import { AssistantMessages } from '../AssistantMessages/AssistantMessages'
import styles from './AssistantPanel.module.css'

const focusable = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled])'

/** На телефоне окно на весь экран: Tab не уходит на страницу под ним. */
function trapFocus(event: KeyboardEvent, container: HTMLElement) {
  const items = [...container.querySelectorAll<HTMLElement>(focusable)]
  const first = items[0]
  const last = items[items.length - 1]
  if (!first || !last) return
  const edge = event.shiftKey ? first : last
  if (document.activeElement !== edge && container.contains(document.activeElement)) return
  event.preventDefault()
  ;(event.shiftKey ? last : first).focus()
}

type Props = {
  chat: ReturnType<typeof useAssistant>
  demo: boolean
  whatsappHref: string | null
  /** returnFocus: false — закрыли кликом мимо окна, фокус остаётся там, куда кликнули. */
  onClose: (returnFocus?: boolean) => void
}

/**
 * Окно чата с Кади. От 640 px — окно в правом нижнем углу, на месте Кади: страницу можно листать,
 * не закрывая разговор. На телефоне — на весь экран, страница под ним не прокручивается.
 * Escape и клик мимо окна (от 640 px) закрывают его; форма передачи менеджеру открывается
 * вместо поля ввода.
 */
export function AssistantPanel({ chat, demo, whatsappHref, onClose }: Props) {
  const titleId = useId()
  const panel = useRef<HTMLElement>(null)
  const [handoff, setHandoff] = useState(false)
  const shown = useRef(false)

  // Смена экрана (чат ↔ передача менеджеру): нажатая кнопка исчезла, фокус — на новый экран.
  useEffect(() => {
    if (!shown.current) {
      shown.current = true
      return
    }
    const selector = handoff ? '[data-autofocus]' : 'textarea'
    panel.current?.querySelector<HTMLElement>(selector)?.focus()
  }, [handoff])

  useEffect(() => {
    const root = document.documentElement
    const phone = window.matchMedia('(max-width: 639.98px)')
    const lock = () => {
      if (phone.matches) root.dataset.scrollLocked = 'true'
      else delete root.dataset.scrollLocked
    }
    lock()
    phone.addEventListener('change', lock)
    // На компьютере сразу можно печатать; на телефоне клавиатура не выскакивает сама.
    const field = panel.current?.querySelector('textarea')
    if (field && !phone.matches) field.focus()
    else panel.current?.focus()
    function onKey(event: KeyboardEvent) {
      // Фокус мог пропасть вместе с нажатой кнопкой (смена экрана) — тогда он на body.
      const inside =
        panel.current?.contains(document.activeElement) || document.activeElement === document.body
      if (event.key === 'Escape' && inside) onClose()
      else if (event.key === 'Tab' && phone.matches && panel.current)
        trapFocus(event, panel.current)
    }
    // Клик в любое место страницы мимо окна закрывает его (на телефоне окно на весь экран).
    // Полоса прокрутки страницы — не «мимо»: ею листают, не закрывая разговор.
    function onPointerDown(event: PointerEvent) {
      const target = event.target
      if (phone.matches || !(target instanceof Node)) return
      if (target === root || panel.current?.contains(target)) return
      onClose(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      phone.removeEventListener('change', lock)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown)
      delete root.dataset.scrollLocked
    }
  }, [onClose])

  return (
    <section
      ref={panel}
      className={styles.panel}
      role="dialog"
      aria-labelledby={titleId}
      tabIndex={-1}
    >
      <div className={styles.head}>
        <AssistantHeader titleId={titleId} />
        <div className={styles.tools}>
          {chat.messages.length > 0 && !handoff && (
            <button
              type="button"
              className={styles.icon}
              onClick={chat.restart}
              aria-label="Начать новый разговор"
              title="Начать новый разговор"
            >
              <RotateCcw size={20} strokeWidth={1.75} aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            className={styles.icon}
            onClick={() => onClose()}
            aria-label="Закрыть чат"
          >
            <X size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>
      {demo && (
        <p className={styles.note}>
          <Info size={16} strokeWidth={1.75} aria-hidden="true" />
          Демоверсия: ИИ не подключён, Кади ищет по каталогу.
        </p>
      )}
      {handoff ? (
        <AssistantHandoff
          conversationId={chat.conversationId}
          whatsappHref={whatsappHref}
          onBack={() => setHandoff(false)}
        />
      ) : (
        <>
          <AssistantMessages chat={chat} onHandoff={() => setHandoff(true)} />
          <AssistantComposer
            disabled={chat.waiting || !chat.conversationId}
            onSend={chat.send}
            onHandoff={() => setHandoff(true)}
          />
        </>
      )}
    </section>
  )
}
