import { ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { Direction } from '@/lib/catalog'
import { catalogHref } from '@/lib/navigationHrefs'
import equipment from '../../../public/images/equipment/widetek-48-1.webp'
import { DirectionArt } from '../DirectionArt/DirectionArt'
import styles from './DesktopDirections.module.css'

export function DesktopDirections({ directions }: { directions: Direction[] }) {
  return (
    <section
      className={styles.section}
      id="studio-directions"
      aria-labelledby="studio-directions-title"
    >
      <div className={styles.heading}>
        <span className={styles.kicker}>01 / ВАША СПЕЦИАЛИЗАЦИЯ</span>
        <h2 id="studio-directions-title">
          Сложные задачи.
          <br />
          <span>Подходящие инструменты.</span>
        </h2>
        <Link href="/catalog">
          Весь каталог <ArrowUpRight size={20} strokeWidth={1.75} />
        </Link>
      </div>
      <div className={styles.grid}>
        {directions.map((direction, index) => (
          <Link
            className={styles.card}
            href={direction.href ?? catalogHref({ direction: direction.slug })}
            key={direction.slug}
          >
            <div className={styles.meta}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <ArrowUpRight size={20} strokeWidth={1.75} />
            </div>
            <div className={styles.art}>
              {direction.slug === 'hardware' ? (
                <Image src={equipment} alt="" sizes="320px" className={styles.equipment} />
              ) : (
                <DirectionArt slug={direction.slug === 'service' ? 'training' : direction.slug} />
              )}
            </div>
            <h3>{direction.title}</h3>
            {direction.summary && <p>{direction.summary}</p>}
          </Link>
        ))}
      </div>
    </section>
  )
}
