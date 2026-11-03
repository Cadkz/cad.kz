'use client'

import { Download } from 'lucide-react'
import { type ChatLine, conversationText } from '@/domain/assistant.mjs'
import styles from './ChatExport.module.css'

type Props = {
  messages: ChatLine[]
  /** icon — квадратная кнопка в шапке окна чата; text — кнопка с подписью в админке. */
  look?: 'icon' | 'text'
  /** Класс кнопки снаружи (шапка окна чата задаёт свой вид значков). */
  className?: string
}

/**
 * «Скачать переписку» (просьба владельца 03.11.2026): разговор с Кадди одним .txt — кто что
 * написал, под ответами товары со ссылками (conversationText). Файл собирается в браузере.
 */
export function ChatExport({ messages, look = 'icon', className }: Props) {
  if (!messages.length) return null
  const save = () => {
    const text = conversationText(messages, { origin: window.location.origin })
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `kaddi-perepiska-${new Date().toISOString().slice(0, 10)}.txt`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  if (look === 'text')
    return (
      <button type="button" className={`${styles.text} ${className ?? ''}`} onClick={save}>
        <Download size={16} strokeWidth={1.75} aria-hidden="true" />
        Скачать переписку (.txt)
      </button>
    )
  return (
    <button
      type="button"
      className={className}
      onClick={save}
      aria-label="Скачать переписку"
      title="Скачать переписку"
    >
      <Download size={20} strokeWidth={1.75} aria-hidden="true" />
    </button>
  )
}
