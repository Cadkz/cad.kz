import type { Payload } from 'payload'
import { QUICK_ACTIONS } from '@/domain/assistant.mjs'
import {
  CONVERSATIONS_LIMIT,
  type ConvRow,
  PERIODS,
  type PeriodKey,
  SEARCHES_LIMIT,
  type SearchRow,
  summarizeConversations,
  summarizeSearches,
} from '@/domain/searchStats.mjs'
import type { ConversationSnapshot } from './assistant/conversation'

const options = { overrideAccess: true, depth: 0, pagination: false } as const

export type Analytics = {
  days: number
  since: string
  searches: ReturnType<typeof summarizeSearches>
  /** Прочитано меньше, чем было: в отчёте только последние SEARCHES_LIMIT запросов. */
  searchesCut: boolean
  kaddi: ReturnType<typeof summarizeConversations>
  kaddiCut: boolean
}

function isSnapshot(value: unknown): value is ConversationSnapshot {
  return Boolean(value) && Array.isArray((value as ConversationSnapshot | null)?.messages)
}

/**
 * Данные страницы «Аналитика» за период: запросы поиска и разговоры Кадди. Читаются только нужные
 * столбцы и не больше SEARCHES_LIMIT / CONVERSATIONS_LIMIT строк — одна страница не нагружает
 * базу Neon сильнее пары обычных списков админки.
 */
export async function loadAnalytics(payload: Payload, period: PeriodKey): Promise<Analytics> {
  const days = PERIODS[period]
  const since = new Date(Date.now() - days * 86_400_000).toISOString()
  const [searchDocs, convDocs] = await Promise.all([
    payload.find({
      collection: 'search-queries',
      where: { createdAt: { greater_than_equal: since } },
      sort: '-createdAt',
      limit: SEARCHES_LIMIT,
      select: { query: true, found: true, source: true, click: true },
      ...options,
    }),
    payload.find({
      collection: 'conversations',
      where: { createdAt: { greater_than_equal: since } },
      sort: '-createdAt',
      limit: CONVERSATIONS_LIMIT,
      select: { createdAt: true, state: true, snapshot: true },
      ...options,
    }),
  ])

  // В сводку — от старых к новым: у запроса остаётся последнее «сколько нашлось».
  const searchRows: SearchRow[] = searchDocs.docs.reverse().map((doc) => ({
    query: doc.query,
    found: doc.found,
    source: doc.source,
    click: doc.click ?? null,
  }))
  const convRows: ConvRow[] = convDocs.docs.flatMap((doc) => {
    if (!isSnapshot(doc.snapshot)) return []
    const snapshot = doc.snapshot
    return [
      {
        id: doc.id,
        createdAt: doc.createdAt,
        state: doc.state,
        messages: snapshot.messages,
        requestNumber: snapshot.requestNumber ?? null,
        handoff: Boolean(snapshot.handoff),
      },
    ]
  })

  return {
    days,
    since,
    searches: summarizeSearches(searchRows),
    searchesCut: searchDocs.docs.length >= SEARCHES_LIMIT,
    kaddi: summarizeConversations(
      convRows,
      QUICK_ACTIONS.flatMap((action) => (action.text ? [action.text] : [])),
    ),
    kaddiCut: convDocs.docs.length >= CONVERSATIONS_LIMIT,
  }
}
