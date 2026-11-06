import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewServerProps } from 'payload'
import { AutoTranslate } from '@/components/AutoTranslate/AutoTranslate'
import { TranslationTable } from '@/components/TranslationTable/TranslationTable'
import { progress } from '@/domain/translationTable.mjs'
import { requireLogin } from '@/lib/adminGate'
import { termTableGroups } from '@/lib/termTable'
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
  const [state, terms] = allowed
    ? await Promise.all([
        translationGroups(payload).then(progress),
        termTableGroups(payload).then(progress),
      ])
    : [null, null]

  return (
    <DefaultTemplate {...template}>
      <div className={styles.root}>
        <h1 className={styles.title}>Переводы</h1>
        {state ? (
          <>
            <p className={styles.lead}>
              Названия, описания, задачи, вопросы и SEO опубликованных товаров и разделов на
              казахском и английском. Проще всего — автоматический перевод ниже; таблица через
              ChatGPT осталась для правки и ручного перевода. Пока перевода нет, на /kk и /en
              показывается русский текст. Характеристики, комплектации и тексты подбора переводятся
              отдельно — общим словарём.
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
              {terms && (
                <p>
                  Словарь характеристик и комплектаций: <strong>{terms.texts}</strong> текстов.
                  Казахский: {terms.kk} ({percent(terms.kk, terms.texts)} %), английский: {terms.en}{' '}
                  ({percent(terms.en, terms.texts)} %).
                  {terms.missingDocs > 0 &&
                    ` Осталось около ${terms.missingChars.toLocaleString('ru-RU')} знаков.`}
                </p>
              )}
            </div>
            <AutoTranslate />
            <TranslationTable />
          </>
        ) : (
          <p>Эта страница доступна администратору и маркетологу.</p>
        )}
      </div>
    </DefaultTemplate>
  )
}
