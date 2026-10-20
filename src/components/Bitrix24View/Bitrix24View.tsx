import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewServerProps } from 'payload'
import { Bitrix24Actions } from '@/components/Bitrix24Actions/Bitrix24Actions'
import { type Bitrix24Status, loadBitrix24Status } from '@/lib/bitrix24Run'
import { formatDateTime } from '@/lib/format'
import styles from './Bitrix24View.module.css'

function Connection({ status }: { status: Bitrix24Status }) {
  if (!status.connected)
    return (
      <p className={styles.lead}>
        Вебхук не вписан: заявки и заказы сохраняются на сайте, но в Битрикс24 не уходят. Чтобы
        включить, впишите адрес входящего вебхука (права CRM и «Пользователи») в Vercel как{' '}
        <code>BITRIX24_WEBHOOK_URL</code> и пересоберите сайт.
      </p>
    )
  return (
    <>
      <p className={styles.lead}>
        Подключён портал <strong>{status.host}</strong>. Каждая заявка и заказ становится лидом:
        контакты, товары с ценами, источник и переписка с Кадди в комментарии.
      </p>
      <p className={styles.note}>
        {status.test ? 'Демоверсия: лиды приходят с пометкой «ТЕСТ сайта» в названии. ' : ''}
        {status.responsibleId
          ? `Ответственный за лиды — пользователь Битрикс24 с ID ${status.responsibleId}.`
          : 'Ответственного назначает сам Битрикс24 (можно задать BITRIX24_RESPONSIBLE_ID).'}
      </p>
    </>
  )
}

function Queue({ status }: { status: Bitrix24Status }) {
  return (
    <section className={styles.section} aria-labelledby="bitrix24-queue">
      <h2 className={styles.heading} id="bitrix24-queue">
        Очередь передачи
      </h2>
      {status.queue.length ? (
        <ul className={styles.list}>
          {status.queue.map((row) => (
            <li key={row.state}>
              {row.label}: <strong>{row.count}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.note}>Заявок ещё не было.</p>
      )}
      {status.problems.length > 0 && (
        <ul className={styles.list}>
          {status.problems.map((row) => (
            <li key={row.id}>
              <a href={`/admin/collections/crm-deliveries/${row.id}`}>
                {formatDateTime(row.updatedAt)}
              </a>
              , попыток {row.attempts}: {row.error || 'без текста ошибки'}
            </li>
          ))}
        </ul>
      )}
      <p className={styles.note}>
        Все записи — <a href="/admin/collections/crm-deliveries">«Передача в CRM»</a>. Ошибка
        повторяется сама с паузой 1, 2, 4, 8 минут, после пяти попыток нужен человек.
      </p>
    </section>
  )
}

/** Страница «Битрикс24» в админке: подключение, проверка связи, тестовый лид, очередь передачи. */
export async function Bitrix24View({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, visibleEntities, permissions, locale } = initPageResult
  const { payload, user, i18n } = req
  const template = {
    i18n,
    locale,
    params,
    payload,
    permissions,
    searchParams,
    user: user ?? undefined,
    visibleEntities,
  }
  const status = user?.role === 'admin' ? await loadBitrix24Status(payload) : null

  return (
    <DefaultTemplate {...template}>
      <div className={styles.root}>
        <h1 className={styles.title}>Битрикс24</h1>
        {status ? (
          <>
            <Connection status={status} />
            {status.connected && <Bitrix24Actions />}
            <Queue status={status} />
          </>
        ) : (
          <p>Эта страница доступна администратору.</p>
        )}
      </div>
    </DefaultTemplate>
  )
}
