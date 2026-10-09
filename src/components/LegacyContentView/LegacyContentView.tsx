import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewServerProps } from 'payload'
import { LegacyContent } from '@/components/LegacyContent/LegacyContent'
import { legacyTotals } from '@/lib/legacyContentRun'
import styles from '../BitrixImportView/BitrixImportView.module.css'

/** Страница «Перенос со старого сайта» в админке. Открывает только администратор. */
export async function LegacyContentView({
  initPageResult,
  params,
  searchParams,
}: AdminViewServerProps) {
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
  return (
    <DefaultTemplate {...template}>
      <div className={styles.root}>
        <h1 className={styles.title}>Перенос со старого сайта</h1>
        {user?.role === 'admin' ? (
          <>
            <p className={styles.lead}>
              Сайт сам скачивает страницы старого cad.kz и переносит тексты сюда. Это нужно сделать
              до переключения домена на новый сайт: потом старых страниц уже не будет. Шаги можно
              запускать сколько угодно раз — перенесённое не дублируется и не перезаписывается.
            </p>
            <LegacyContent {...legacyTotals()} />
          </>
        ) : (
          <p>Эта страница доступна только администратору.</p>
        )}
      </div>
    </DefaultTemplate>
  )
}
