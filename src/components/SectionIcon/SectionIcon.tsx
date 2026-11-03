import Image from 'next/image'
import { iconArtUrl } from '@/domain/sectionArt.mjs'
import styles from './SectionIcon.module.css'

type Props = {
  /** Ключ значка: имя иллюстрации («cad-bim») или прежний ключ из админки («building»). */
  name?: string | null
  /** Размер в px, под который грузится картинка; на экране она занимает всю свою плашку. */
  size?: number
  className?: string
}

/**
 * Значок раздела, категории или группы — иллюстрация владельца (03.11.2026). Линейных значков
 * старого образца больше нет: неизвестный ключ — общая иллюстрация (src/domain/sectionArt.mjs).
 * Размер задаёт родитель: картинка заполняет его плашку.
 */
export function SectionIcon({ name, size = 48, className }: Props) {
  return (
    <Image
      src={iconArtUrl(name)}
      alt=""
      width={256}
      height={256}
      sizes={`${size}px`}
      aria-hidden="true"
      className={`${styles.art} ${className ?? ''}`}
    />
  )
}
