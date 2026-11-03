import type { UIFieldServerComponent } from 'payload'
import { ChatExport } from '@/components/ChatExport/ChatExport'
import { KnowledgeNote } from '@/components/KnowledgeNote/KnowledgeNote'
import { formatDateTime } from '@/lib/format'
import styles from './ConversationView.module.css'

type Card = { href: string; title: string; vendor?: string | null }
type Message = {
  at?: string
  role: 'user' | 'assistant' | string
  content?: string
  replies?: string[]
  cards?: Card[]
}

function messagesOf(snapshot: unknown): Message[] {
  if (!snapshot || typeof snapshot !== 'object' || !('messages' in snapshot)) return []
  const { messages } = snapshot as { messages: unknown }
  return Array.isArray(messages)
    ? messages.filter((m): m is Message => Boolean(m && typeof m === 'object' && 'role' in m))
    : []
}

/**
 * Диалог Кадди в админке как обычный чат, а не код (просьба владельца 03.11.2026): реплики
 * клиента справа, Кадди слева, кнопки и карточки товаров под ответом. Под каждым ответом Кадди —
 * «Поправить»: комментарий сразу уходит в базу знаний. Исходный снимок — в «Снимок (код)».
 */
export const ConversationView: UIFieldServerComponent = async ({ id, payload, user }) => {
  if (!id) return null
  const doc = await payload.findByID({
    collection: 'conversations',
    id,
    depth: 0,
    user,
    overrideAccess: false,
  })
  const messages = messagesOf(doc.snapshot)
  if (!messages.length) return <p className={styles.empty}>В диалоге нет сообщений.</p>

  return (
    <section className={styles.root} aria-label="Переписка">
      <div className={styles.top}>
        <h3 className={styles.title}>Переписка</h3>
        <ChatExport messages={messages} look="text" />
      </div>
      <ol className={styles.list}>
        {messages.map((message, index) => {
          const mine = message.role === 'user'
          const question =
            [...messages.slice(0, index)].reverse().find((m) => m.role === 'user')?.content ?? ''
          return (
            <li
              // biome-ignore lint/suspicious/noArrayIndexKey: снимок только для чтения, порядок неизменен
              key={index}
              className={mine ? styles.client : styles.kaddi}
            >
              <span className={styles.who}>
                {mine ? 'Клиент' : 'Кадди'}
                {message.at && ` · ${formatDateTime(message.at)}`}
              </span>
              {message.content && <p className={styles.bubble}>{message.content}</p>}
              {message.cards && message.cards.length > 0 && (
                <p className={styles.meta}>
                  Карточки:{' '}
                  {message.cards.map((card, n) => (
                    <span key={card.href}>
                      {n > 0 && '; '}
                      <a href={card.href} target="_blank" rel="noreferrer">
                        {card.title}
                      </a>
                    </span>
                  ))}
                </p>
              )}
              {message.replies && message.replies.length > 0 && (
                <p className={styles.meta}>Кнопки: {message.replies.join(' · ')}</p>
              )}
              {!mine && <KnowledgeNote question={question} />}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
