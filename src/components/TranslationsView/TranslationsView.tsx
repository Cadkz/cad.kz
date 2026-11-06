import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewServerProps } from 'payload'
import { TranslationTable } from '@/components/TranslationTable/TranslationTable'
import { progress } from '@/domain/translationTable.mjs'
import { requireLogin } from '@/lib/adminGate'
import { translationGroups } from '@/lib/translationTable'
import styles from './TranslationsView.module.css'

const percent = (part: number, all: number) => (all ? Math.floor((part / all) * 100) : 100)

/** Страница «Переводы» в админке: тексты товаров и разделов на казахском и английском. */
export async function TranslationsView({
  initPageResult,
  params,
  searchParams,
  viewActions,
}: AdminViewServerProps) {
  const { req, visibleEntities, permissions, locale } = initPageResult
  requireLogin(req)
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
    viewActions,
  }
  const allowed = user?.role === 'admin' || user?.role === 'editor'
  const state = allowed ? progress(await translationGroups(payload)) : null

  return (
    <DefaultTemplate {...template}>
      <div className={styles.root}>
        <h1 className={styles.title}>Переводы</h1>
        {state ? (
          <>
            <p className={styles.lead}>
              Названия, описания, задачи, вопросы и SEO опубликованных товаров и разделов на
              казахском и английском. Скачайте часть, переведите в ChatGPT и загрузите файл обратно.
              Пока перевода нет, на /kk и /en показывается русский текст. Характеристики и
              комплектации переводятся отдельно.
            </p>
            <div className={styles.state}>
              <p>
                Всего текстов: <strong>{state.texts}</strong>. Казахский: {state.kk} (
                {percent(state.kk, state.texts)} %), английский: {state.en} (
                {percent(state.en, state.texts)} %).
              </p>
              <p>
                {state.missingDocs
                  ? `Осталось: ${state.missingDocs} товаров и разделов, около ${state.missingChars.toLocaleString('ru-RU')} знаков русского текста.`
                  : 'Всё переведено.'}
              </p>
            </div>
            <TranslationTable />
          </>
        ) : (
          <p>Эта страница доступна администратору и маркетологу.</p>
        )}
      </div>
    </DefaultTemplate>
  )
}
