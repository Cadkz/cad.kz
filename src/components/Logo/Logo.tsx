import Image from 'next/image'
import Link from 'next/link'
import logo from '../../../public/images/brand/cad-kz-logo.png'
import styles from './Logo.module.css'

export function Logo({ priority = false }: { priority?: boolean }) {
  return (
    <Link href="/" className={styles.logo} aria-label="CAD.kz — на главную">
      <Image src={logo} alt="" width={89} height={28} priority={priority} />
    </Link>
  )
}
