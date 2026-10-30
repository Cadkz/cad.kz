import { AnalyticsTable } from '@/components/AnalyticsTable/AnalyticsTable'
import { QUICK_ACTIONS } from '@/domain/assistant.mjs'
import type { summarizeConversations } from '@/domain/searchStats.mjs'

type Props = {
  kaddi: ReturnType<typeof summarizeConversations>
  /** Разговоров за период больше, чем читается в отчёт. */
  cut: boolean
  csv: (part: string) => string
  show: number
  /** Ссылки на сами разговоры — только администратору (у маркетолога «Диалогов» нет). */
  admin: boolean
}

const date = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Almaty',
  })

const buttonLabel = (text: string) =>
  QUICK_ACTIONS.find((action) => action.text === text)?.label ?? text

/**
 * Часть страницы «Аналитика» про Кадди: кнопки, частые вопросы, какие товары он показывал,
 * когда передавал менеджеру и где не знал ответа (по фразам «уточнит специалист» и т. п.).
 */
export function AnalyticsKaddi({ kaddi, cut, csv, show, admin }: Props) {
  const dialog = (id: number, text: string) =>
    admin ? <a href={`/admin/collections/conversations/${id}`}>{text}</a> : text
  return (
    <>
      <AnalyticsTable
        id="analytics-kaddi-questions"
        title="О чём спрашивают Кадди"
        note={`Одинаковые вопросы складываются (без учёта регистра и знаков в конце). Телефоны и почта скрыты. Разговоров за период: ${kaddi.total}, сообщений клиентов: ${kaddi.userMessages}${cut ? ' — в отчёте только последние' : ''}.`}
        head={['Вопрос', 'Раз']}
        rows={kaddi.questions.slice(0, show).map((q) => [q.text, q.count])}
        total={kaddi.questions.length}
        csv={csv('kaddi-questions')}
        empty="За этот период Кадди ещё не спрашивали."
      />
      <AnalyticsTable
        id="analytics-kaddi-buttons"
        title="Кнопки под приветствием"
        head={['Кнопка', 'Нажали']}
        rows={kaddi.buttons.map((b) => [buttonLabel(b.text), b.count])}
        empty="Кнопки не нажимали."
      />
      <AnalyticsTable
        id="analytics-kaddi-cards"
        title="Какие товары Кадди показывал"
        head={['Товар', 'Раз']}
        rows={kaddi.cards.slice(0, show).map((c) => [
          <a key="card" href={c.href} target="_blank" rel="noreferrer">
            {c.title}
          </a>,
          c.count,
        ])}
        total={kaddi.cards.length}
        empty="Карточек товаров не показывал."
      />
      <AnalyticsTable
        id="analytics-kaddi-handoff"
        title="Передал менеджеру"
        note="Разговоры, переданные заявкой. Первый вопрос клиента — с чем приходили."
        head={['Когда', 'Первый вопрос', 'Заявка']}
        rows={kaddi.handedOff
          .slice(0, show)
          .map((h) => [date(h.at), dialog(h.id, h.question), h.number ?? '—'])}
        total={kaddi.handedOff.length}
        csv={csv('handoffs')}
        empty="Передач менеджеру не было."
      />
      <AnalyticsTable
        id="analytics-kaddi-unknown"
        title="Где Кадди не знал ответа"
        note="Ответы со словами «уточнит специалист», «нет данных», «в описании нет» и похожими (цена по запросу не считается). Подсказка, что дописать в базу знаний или описание товара."
        head={['Когда', 'Вопрос', 'Ответ Кадди']}
        rows={kaddi.unknown
          .slice(0, show)
          .map((u) => [date(u.at), dialog(u.id, u.question), u.reply])}
        total={kaddi.unknown.length}
        csv={csv('unknown')}
        empty="Таких ответов не нашлось."
      />
    </>
  )
}
