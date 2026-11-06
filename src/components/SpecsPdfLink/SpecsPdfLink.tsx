import { FileDown } from 'lucide-react'
import { specSheetHref } from '@/domain/specSheet.mjs'
import { getT } from '@/i18n/server'
import styles from './SpecsPdfLink.module.css'

/**
 * «Скачать характеристики, PDF» под характеристиками оборудования — для закупок и тендеров
 * (пожелание владельца 30.10.2026). Обычная ссылка: файл собирает сервер, скрипт не нужен.
 */
export async function SpecsPdfLink({ slug }: { slug: string }) {
  const t = await getT()
  return (
    <a className={styles.link} href={specSheetHref(slug)} download>
      <FileDown size={20} strokeWidth={1.75} aria-hidden="true" />
      {t('Скачать характеристики, PDF')}
    </a>
  )
}
