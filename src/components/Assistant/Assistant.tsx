'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAssistant } from '@/lib/useAssistant'
import { AssistantPanel } from '../AssistantPanel/AssistantPanel'
import { HeaderAction } from '../HeaderAction/HeaderAction'
import { Mascot } from '../Mascot/Mascot'
import styles from './Assistant.module.css'

type Props = {
  /** Модель не подключена: Кади честно говорит об этом и ищет по каталогу. */
  demo: boolean
  whatsappHref: string | null
}

/**
 * ИИ-консультант Кади: кнопка с головой Кади в закреплённой строке шапки и окно чата.
 * В шапке кнопка видна на любой странице и ничего не закрывает (цены, кнопки, поля), в отличие
 * от плавающего кружка. Выводится, только когда работает сервис консультанта
 * (src/lib/assistant/provider.ts); само окно не всплывает — его открывает человек.
 * Разговор не теряется при переходе по страницам и закрытии окна.
 */
export function Assistant({ demo, whatsappHref }: Props) {
  const [open, setOpen] = useState(false)
  // Окно выносится в body: у закреплённой шапки есть backdrop-filter, внутри неё fixed не работает.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const chat = useAssistant()
  const launcher = useRef<HTMLButtonElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    // Окно закрыто — фокус возвращается на кнопку, с которой его открыли.
    requestAnimationFrame(() => launcher.current?.focus())
  }, [])

  return (
    <>
      <HeaderAction
        ref={launcher}
        icon={
          <span className={styles.head}>
            <Mascot pose="head" size="icon" eager />
          </span>
        }
        label="Спросить Кади"
        ariaLabel="Спросить Кади — ИИ-помощник CAD.kz"
        aria-haspopup="dialog"
        aria-expanded={open}
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
