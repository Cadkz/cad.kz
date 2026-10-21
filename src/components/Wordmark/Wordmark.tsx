import Link from 'next/link'
import styles from './Wordmark.module.css'

const LETTERS = ['c', 'a', 'd', '.', 'k', 'z']

/**
 * Огромная надпись cad.kz со знаком во всю ширину рамки — финал подвала. Когда подвал входит
 * в экран, знак и буквы по очереди поднимаются (CSS, анимация по прокрутке); под мышью буква
 * подпрыгивает и светлеет. Без поддержки анимации по прокрутке — просто стоит на месте.
 */
export function Wordmark() {
  return (
    <Link href="/" className={styles.wordmark} aria-label="CAD.kz — на главную">
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
