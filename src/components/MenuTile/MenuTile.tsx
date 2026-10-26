import Image from 'next/image'
import Link from 'next/link'
import type { MenuLogo } from '@/lib/navigation'
import { SectionIcon } from '../SectionIcon/SectionIcon'
import styles from './MenuTile.module.css'

type Props = {
  title: string
  /** Логотип производителя; иначе значок раздела или категории; иначе буквы названия. */
  logo?: MenuLogo | null
  icon?: string | null
  /** Ссылка — переход на страницу; без неё — кнопка следующего шага меню. */
  href?: string
  onClick: () => void
}

/** Две первые буквы названия — знак производителя без логотипа (Base, MagiCAD). */
const initials = (title: string) =>
  title
    .replace(/[«»"()]/g, '')
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

/**
 * Карточка мегаменю одного размера для всех шагов (замечание владельца 27.10.2026: «карточки
 * разного размера — лучше миниатюрное лого и заголовок»): слева знак 32 px, справа название
 * не длиннее двух строк. Без перечисления того, что внутри.
 */
export function MenuTile({ title, logo, icon, href, onClick }: Props) {
  const mark = logo ? (
    <Image
      src={logo.url}
      alt=""
      width={logo.width}
      height={logo.height}
      sizes="32px"
      unoptimized={logo.local}
      className={styles.logo}
    />
  ) : icon ? (
    <SectionIcon name={icon} size={16} />
  ) : (
    initials(title)
  )
  const body = (
    <>
      <span className={logo ? styles.mark : `${styles.mark} ${styles.plain}`} aria-hidden="true">
        {mark}
      </span>
      <span className={styles.title}>{title}</span>
    </>
  )
  return href ? (
    <Link href={href} className={styles.tile} onClick={onClick}>
      {body}
    </Link>
  ) : (
    <button type="button" className={styles.tile} onClick={onClick}>
      {body}
    </button>
  )
}
