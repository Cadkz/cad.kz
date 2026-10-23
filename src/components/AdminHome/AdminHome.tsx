import type { Payload, ServerProps } from 'payload'
import { AdminActions } from '@/components/AdminActions/AdminActions'
import { AdminCardGrid } from '@/components/AdminCardGrid/AdminCardGrid'
import { loadCrmCard, loadPromosCard, loadRequestsCard, type QueueCard } from '@/lib/adminQueue'
import { loadActivityCard, loadRatesCard } from '@/lib/adminRecent'
import styles from './AdminHome.module.css'

type Section = { key: string; title: string; cards: QueueCard[] }

/** Карточка, которая не загрузилась, не должна ронять всю главную админки. */
async function safe(load: () => Promise<QueueCard>, title: string): Promise<QueueCard> {
  try {
    return await load()
  } catch (error) {
    console.error(`Главная админки: «${title}» не загрузилась`, error)
    return { key: title, title, total: 0, tone: 'alert', items: [], empty: 'Не удалось загрузить.' }
  }
}

async function loadSections(payload: Payload, admin: boolean): Promise<Section[]> {
  const now = new Date()
  // Черновики и неполные карточки владелец убрал с главной (23.10.2026): списки остаются
  // в «Каталог → Товары» и на странице «Заполненность».
  const [requests, crm, promos, rates, activity] = await Promise.all([
    admin ? safe(() => loadRequestsCard(payload, now), 'Заявки') : null,
    admin ? safe(() => loadCrmCard(payload), 'Ошибки CRM') : null,
    safe(() => loadPromosCard(payload, now), 'Акции'),
    safe(() => loadRatesCard(payload), 'Курсы и НДС'),
    safe(() => loadActivityCard(payload), 'Журнал'),
  ])
  // Ошибки CRM — первыми: заявку, не дошедшую до менеджеров, надо увидеть сразу.
  const work = [crm, requests, promos].filter((card): card is QueueCard => card !== null)
  return [
    { key: 'work', title: 'Требует внимания', cards: work },
    { key: 'prices', title: 'Цены и журнал', cards: [rates, activity] },
  ]
}

/**
 * Главная админки — очередь работы: быстрые кнопки, затем что требует внимания (ошибки CRM,
 * заявки, заканчивающиеся акции), курсы и журнал.
 * Ниже Payload показывает все разделы админки по группам меню.
 */
export async function AdminHome({ payload, user }: ServerProps) {
  if (user?.role !== 'admin' && user?.role !== 'editor') return null
  const sections = await loadSections(payload, user.role === 'admin')
  return (
    <div className={styles.root}>
      <AdminActions />
      {sections.map((section) => (
        <section
          key={section.key}
          className={styles.section}
          aria-labelledby={`home-${section.key}`}
        >
          <h2 className={styles.title} id={`home-${section.key}`}>
            {section.title}
          </h2>
          <AdminCardGrid cards={section.cards} />
        </section>
      ))}
    </div>
  )
}
