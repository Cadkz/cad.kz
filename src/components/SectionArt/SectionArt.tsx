import Image from 'next/image'
import { iconArtUrl, sectionArtUrl } from '@/domain/sectionArt.mjs'
import styles from './SectionArt.module.css'

type Props = {
  /** Адрес раздела: по нему выбирается иллюстрация. */
  slug?: string | null
  /** Ключ значка из админки, если у раздела своей иллюстрации нет. */
  icon?: string | null
  /** Размер иллюстрации в px (картинка квадратная). */
  size: 48 | 96
  className?: string
}

/** Иллюстрация раздела: своя по адресу раздела, иначе по ключу значка (src/domain/sectionArt.mjs). */
export function SectionArt({ slug, icon, size, className }: Props) {
  return (
    <Image
      src={sectionArtUrl(slug) ?? iconArtUrl(icon)}
      alt=""
      width={size}
      height={size}
      sizes={`${size}px`}
      className={`${styles.art} ${className ?? ''}`}
    />
  )
}
