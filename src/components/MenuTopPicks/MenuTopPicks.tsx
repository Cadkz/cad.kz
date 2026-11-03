import type { MenuLink } from '@/lib/navigation'
import { MenuTile } from '../MenuTile/MenuTile'
import styles from './MenuTopPicks.module.css'

type Props = {
  links: MenuLink[]
  /** Короткое название для карточки меню. */
  titleOf: (title: string) => string
  onNavigate: () => void
}

/**
 * «Популярное» направления программ в мегаменю (правка владельца 03.11.2026): под чипами
 * производителей сразу главные программы — AutoCAD, Revit, коллекции; SCAD Office, ЛИРА-FEM; GEO5.
 */
export function MenuTopPicks({ links, titleOf, onNavigate }: Props) {
  return (
    <section className={styles.root} aria-label="Популярное">
      <p className={styles.label}>Популярное</p>
      <ul className={styles.cards}>
        {links.map((link) => (
          <li key={link.href}>
            <MenuTile
              title={titleOf(link.title)}
              logo={link.logo}
              href={link.href}
              onClick={onNavigate}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
