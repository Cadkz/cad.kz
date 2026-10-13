import Link from 'next/link'
import styles from './MenuCard.module.css'

type Props = { title: string; hint: string | null; href: string; onNavigate: () => void }

/** Карточка-ссылка в мегаменю: название программы или производителя и подсказка мелко под ним. */
export function MenuCard({ title, hint, href, onNavigate }: Props) {
  return (
    <li>
      <Link href={href} className={styles.card} onClick={onNavigate}>
        <span className={styles.title}>{title}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </Link>
    </li>
  )
}
