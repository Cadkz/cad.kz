import Image from 'next/image'
import { sectionArtUrl } from '@/domain/sectionArt.mjs'
import { SectionIcon } from '../SectionIcon/SectionIcon'
import styles from './SectionArt.module.css'

type Props = {
  /** Адрес раздела: по нему выбирается иллюстрация. */
  slug?: string | null
  /** Значок lucide, если иллюстрации у раздела нет. */
  icon?: string | null
  /** Размер иллюстрации в px (картинка квадратная). */
  size: 48 | 96
  iconSize?: 16 | 20 | 24
  className?: string
}

/** Иллюстрация раздела из одобренного концепта; без неё — прежний значок. */
export function SectionArt({ slug, icon, size, iconSize = 20, className }: Props) {
  const url = sectionArtUrl(slug)
  if (!url) return <SectionIcon name={icon} size={iconSize} className={className} />
  return (
    <Image
      src={url}
      alt=""
      width={size}
      height={size}
      sizes={`${size}px`}
      className={`${styles.art} ${className ?? ''}`}
    />
  )
}
