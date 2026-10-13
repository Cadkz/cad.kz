import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewServerProps } from 'payload'
import { AssistantCheck } from '@/components/AssistantCheck/AssistantCheck'
import { assistantStatus } from '@/lib/assistant/check'
import styles from './AssistantCheckView.module.css'

/** Страница «Проверка Юки» в админке: администратор и маркетолог. */
export function AssistantCheckView({ initPageResult, params, searchParams }: AdminViewServerProps) {
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
  const allowed = user?.role === 'admin' || user?.role === 'editor'
  const status = assistantStatus()

  return (
    <DefaultTemplate {...template}>
      <div className={styles.root}>
        <h1 className={styles.title}>Проверка Юки</h1>
        {allowed ? (
          <>
            <p className={styles.lead}>
              Типичные вопросы клиентов задаются Юки по очереди — так же, как на сайте, с теми же
              правилами, прайсом и базой знаний. Разговоры не сохраняются и менеджерам не уходят.
              Под ответом — что Юки искал в прайсе и каталоге и какие цены получил, красным — на что
              посмотреть: цена не из прайса, срок без прайса, «я передал» до передачи, женский род о
              себе, длинный ответ.
            </p>
            <p className={status.mode === 'model' ? styles.on : styles.off}>
              <strong>{status.label}</strong>
            </p>
            {status.mode === 'off' ? (
              <p>Включите консультанта: MODEL_PROVIDER и MODEL_API_KEY в настройках Vercel.</p>
            ) : (
              <AssistantCheck />
            )}
          </>
        ) : (
          <p>Эта страница доступна администратору и маркетологу.</p>
        )}
      </div>
    </DefaultTemplate>
  )
}
