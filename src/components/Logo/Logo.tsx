import Image from 'next/image'
import Link from 'next/link'
import logo from '../../../public/images/brand/cad-kz-logo.png'
import styles from './Logo.module.css'

/**
 * Логотип CAD.kz, ведёт на главную.
 * mark — синий знак без надписи (шапка, решение владельца 13.10.2026): вектор, цвет --color-blue;
 * full — знак с надписью cad.kz (подвал).
 */
export function Logo({
  variant = 'full',
  priority = false,
}: {
  variant?: 'mark' | 'full'
  priority?: boolean
}) {
  if (variant === 'mark') {
    return (
      <Link href="/" className={styles.mark} aria-label="CAD.kz — на главную">
        {/* Геометрия знака из Макеты/Cad_kz_значок_rgb: диагонали под 45°. */}
        <svg viewBox="0 0 140 199" aria-hidden="true" focusable="false">
          <path d="M0 0H140V42H0Z" />
          <path d="M0 42L41 83V141L0 100Z" />
          <path d="M140 42V100L41 199V141Z" />
        </svg>
      </Link>
    )
  }
  return (
    <Link href="/" className={styles.logo} aria-label="CAD.kz — на главную">
      <Image src={logo} alt="" width={89} height={28} priority={priority} />
    </Link>
  )
}
