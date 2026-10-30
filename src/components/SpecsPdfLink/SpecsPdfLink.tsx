import { FileDown } from 'lucide-react'
import { specSheetHref } from '@/domain/specSheet.mjs'
import styles from './SpecsPdfLink.module.css'

/**
 * «Скачать характеристики, PDF» под характеристиками оборудования — для закупок и тендеров
 * (пожелание владельца 30.10.2026). Обычная ссылка: файл собирает сервер, скрипт не нужен.
 */
export function SpecsPdfLink({ slug }: { slug: string }) {
  return (
    <a className={styles.link} href={specSheetHref(slug)} download>
      <FileDown size={20} strokeWidth={1.75} aria-hidden="true" />
      Скачать характеристики, PDF
    </a>
  )
}
