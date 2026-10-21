import Link from 'next/link'
import styles from './Wordmark.module.css'

const LETTERS = ['c', 'a', 'd', '.', 'k', 'z']

/**
 * Надпись cad.kz со знаком — финал тёмного подвала (21.10.2026, из пробной ветки
 * redesign/home-motion, но заметно меньше: ширину задаёт подвал колонками сетки, слева,
 * чтобы Кадди в правом углу её не закрывал). Когда подвал входит в экран, знак и буквы
 * по очереди поднимаются: где браузер умеет анимацию по прокрутке — вместе с прокруткой,
 * иначе по времени через RevealObserver (data-reveal). Под мышью буква подпрыгивает.
 */
export function Wordmark() {
  return (
    <Link href="/" className={styles.wordmark} aria-label="CAD.kz — на главную" data-reveal>
      <span className={styles.row} aria-hidden="true">
        {/* Геометрия знака — как в шапке (Logo mark), диагонали под 45°. */}
        <svg className={styles.mark} viewBox="0 0 140 199" focusable="false" aria-hidden="true">
          <path d="M0 0H140V42H0Z" />
          <path d="M0 42L41 83V141L0 100Z" />
          <path d="M140 42V100L41 199V141Z" />
        </svg>
        {LETTERS.map((letter, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: буквы надписи постоянные, порядок не меняется
          <span key={i} className={styles.letter}>
            {letter}
          </span>
        ))}
      </span>
    </Link>
  )
}
