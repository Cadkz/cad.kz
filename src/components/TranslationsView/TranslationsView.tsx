import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewServerProps } from 'payload'
import { AutoTranslate } from '@/components/AutoTranslate/AutoTranslate'
import { TranslationTable } from '@/components/TranslationTable/TranslationTable'
import { progress } from '@/domain/translationTable.mjs'
import { requireLogin } from '@/lib/adminGate'
import { siteTableGroups } from '@/lib/siteTextTable'
import { termTableGroups } from '@/lib/termTable'
import { translationGroups } from '@/lib/translationTable'
import styles from './TranslationsView.module.css'

const percent = (part: number, all: number) => (all ? Math.floor((part / all) * 100) : 100)

type Progress = ReturnType<typeof progress>

const SET_NAMES = [
  'Тексты сайта (главная, BIM, контакты и подвал, страницы, новости)',
  'Товары и разделы',
  'Характеристики и комплектации (словарь)',
]

/**
 * Сводка: по каждому набору и по всему сайту. Проценты — по объёму русского текста (знакам):
 * короткая подпись словаря и описание товара весят по-разному.
 */
function Summary({ sets }: { sets: Progress[] }) {
  const all = sets.reduce(
    (sum, set) => ({
      texts: sum.texts + set.texts,
      chars: sum.chars + set.chars,
      kkChars: sum.kkChars + set.kkChars,
      enChars: sum.enChars + set.enChars,
      missingChars: sum.missingChars + set.missingChars,
    }),
    { texts: 0, chars: 0, kkChars: 0, enChars: 0, missingChars: 0 },
  )
  return (
    <div className={styles.state}>
      <p>
        <strong>
          Весь сайт: казахский {percent(all.kkChars, all.chars)} %, английский{' '}
          {percent(all.enChars, all.chars)} %
        </strong>{' '}
        (текстов: {all.texts}
        {all.missingChars > 0
          ? `, осталось около ${all.missingChars.toLocaleString('ru-RU')} знаков русского текста`
          : ', всё переведено'}
        ).
      </p>
      <ul className={styles.sets}>
        {sets.map((set, index) => (
          <li key={SET_NAMES[index]}>
            {SET_NAMES[index]}: казахский {percent(set.kkChars, set.chars)} %, английский{' '}
            {percent(set.enChars, set.chars)} % (текстов: {set.texts}
            {set.missingChars > 0 &&
              `, осталось около ${set.missingChars.toLocaleString('ru-RU')} знаков`}
            ).
          </li>
        ))}
      </ul>
      <p>Проценты — по объёму русского текста.</p>
    </div>
  )
}

/** Страница «Переводы» в админке: все тексты сайта на казахском и английском. */
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
  const sets = allowed
    ? await Promise.all([
        siteTableGroups(payload).then(progress),
        translationGroups(payload).then(progress),
        termTableGroups(payload).then(progress),
      ])
    : null

  return (
    <DefaultTemplate {...template}>
      <div className={styles.root}>
        <h1 className={styles.title}>Переводы</h1>
        {sets ? (
          <>
            <p className={styles.lead}>
              Все тексты сайта на казахском и английском: главная, страница BIM, контакты и подвал,
              страницы, новости и статьи, товары и разделы, характеристики и комплектации. Проще
              всего — автоматический перевод ниже; таблица через ChatGPT осталась для правки и
              ручного перевода. Пока перевода нет, на /kk и /en показывается русский текст.
            </p>
            <Summary sets={sets} />
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
