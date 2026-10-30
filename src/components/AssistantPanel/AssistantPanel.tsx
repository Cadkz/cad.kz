'use client'

import { Info, RotateCcw, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { whatsappMessage } from '@/domain/assistant.mjs'
import type { HandoffPrefill, useAssistant } from '@/lib/useAssistant'
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
  /** Чат часто открывали и закрывали — Кадди встречает недовольным. */
  grumpy: boolean
  whatsappHref: string | null
  /** Окно закрыто и доигрывает сворачивание в Кадди; потом onClosed убирает его из разметки. */
  closing: boolean
  /** returnFocus: false — закрыли кликом мимо окна, фокус остаётся там, куда кликнули. */
  onClose: (returnFocus?: boolean) => void
  onClosed: () => void
}

/** Запас на случай, если конец анимации не пришёл (вкладка в фоне): окно всё равно уберётся. */
const CLOSE_FALLBACK_MS = 600

/**
 * Окно чата с Кадди. От 640 px — окно в правом нижнем углу, на месте Кадди: страницу можно листать,
 * не закрывая разговор. На телефоне — на весь экран, страница под ним не прокручивается.
 * Escape и клик мимо окна (от 640 px) закрывают его, на телефоне — ещё и переход по ссылке
 * на страницу сайта; форма передачи менеджеру открывается вместо поля ввода.
 */
export function AssistantPanel({
  chat,
  demo,
  grumpy,
  whatsappHref,
  closing,
  onClose,
  onClosed,
}: Props) {
  const titleId = useId()
  const panel = useRef<HTMLElement>(null)
  // false — разговор; объект — форма передачи (prefill — данные, которые собрал Кадди).
  const [handoff, setHandoff] = useState<false | { prefill?: HandoffPrefill }>(false)
  const shown = useRef(false)
  // Сколько сообщений было, когда окно открыли: форму сам открывает только новый ответ (Ка3),
  // а не старый из сохранённого разговора.
  const known = useRef(chat.messages.length)
  const count = chat.messages.length
  const last = chat.messages[count - 1]

  useEffect(() => {
    if (count <= known.current) return
    known.current = count
    if (last?.role === 'assistant' && last.form) setHandoff({ prefill: last.handoff })
  }, [count, last])

  // Смена экрана (чат ↔ передача менеджеру): нажатая кнопка исчезла, фокус — на новый экран.
  useEffect(() => {
    if (!shown.current) {
      shown.current = true
      return
    }
    const selector = handoff ? '[data-autofocus]' : 'textarea'
    panel.current?.querySelector<HTMLElement>(selector)?.focus()
  }, [handoff])

  // Закрыли — окно сворачивается в Кадди и убирается, когда анимация кончилась.
  useEffect(() => {
    if (!closing) return
    const node = panel.current
    const done = (event?: AnimationEvent) => {
      if (event && event.target !== node) return
      onClosed()
    }
    const timer = setTimeout(done, CLOSE_FALLBACK_MS)
    node?.addEventListener('animationend', done)
    return () => {
      clearTimeout(timer)
      node?.removeEventListener('animationend', done)
    }
  }, [closing, onClosed])

  // Телефон: окно — ровно видимая часть экрана. Открылась клавиатура — iOS сдвигает видимую
  // область, а окно с inset: 0 оставалось на месте, и под ним просвечивала страница
  // (замечание владельца 30.10.2026). Высота и верх берутся из visualViewport.
  useEffect(() => {
    const viewport = window.visualViewport
    const node = panel.current
    if (!viewport || !node) return
    const fit = () => {
      node.style.setProperty('--viewport-top', `${Math.round(viewport.offsetTop)}px`)
      node.style.setProperty('--viewport-height', `${Math.round(viewport.height)}px`)
    }
    fit()
    viewport.addEventListener('resize', fit)
    viewport.addEventListener('scroll', fit)
    return () => {
      viewport.removeEventListener('resize', fit)
      viewport.removeEventListener('scroll', fit)
    }
  }, [])

  useEffect(() => {
    if (closing) return
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
    // Телефон: окно на весь экран, и переход по ссылке из чата (карточка товара, «Корзина»)
    // шёл за ним незаметно — казалось, что ссылка не работает (замечание владельца 20.10.2026).
    // Ссылка на страницу сайта закрывает окно, страница видна сразу; разговор сохраняется,
    // голова Кадди в шапке открывает его снова. WhatsApp и другие сайты — как обычно.
    function onLinkClick(event: MouseEvent) {
      if (!phone.matches || !(event.target instanceof Element)) return
      const link = event.target.closest('a[href]')
      if (!(link instanceof HTMLAnchorElement) || link.target === '_blank') return
      if (link.origin !== window.location.origin) return
      onClose(false)
    }
    const node = panel.current
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown)
    node?.addEventListener('click', onLinkClick)
    return () => {
      phone.removeEventListener('change', lock)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown)
      node?.removeEventListener('click', onLinkClick)
      delete root.dataset.scrollLocked
    }
  }, [onClose, closing])

  return (
    <section
      ref={panel}
      className={styles.panel}
      data-closing={closing}
      inert={closing}
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
          Демоверсия: ИИ не подключён, Кадди ищет по каталогу.
        </p>
      )}
      {chat.live && (
        <p className={styles.note}>
          <Info size={16} strokeWidth={1.75} aria-hidden="true" />
          {chat.manager
            ? 'Вам отвечает менеджер CAD.kz. Кадди пока молчит.'
            : 'Разговор видят менеджеры CAD.kz и могут подключиться.'}
        </p>
      )}
      {handoff ? (
        <AssistantHandoff
          conversationId={chat.conversationId}
          prefill={handoff.prefill}
          whatsappHref={
            whatsappHref &&
            `${whatsappHref}?text=${encodeURIComponent(whatsappMessage(chat.messages, handoff.prefill))}`
          }
          onBack={() => setHandoff(false)}
        />
      ) : (
        <>
          <AssistantMessages
            chat={chat}
            grumpy={grumpy}
            onHandoff={(prefill) => setHandoff({ prefill })}
            whatsapp={
              whatsappHref &&
              `${whatsappHref}?text=${encodeURIComponent(whatsappMessage(chat.messages))}`
            }
          />
          <AssistantComposer
            disabled={chat.waiting || !chat.conversationId}
            manager={chat.manager}
            onSend={chat.send}
            onHandoff={() => setHandoff({})}
          />
        </>
      )}
    </section>
  )
}
