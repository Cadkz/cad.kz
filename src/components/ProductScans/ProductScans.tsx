import { SCANS_CREDIT } from '@/domain/artecScans.mjs'
import { ProductSection } from '../ProductSection/ProductSection'
import { ScanCard } from '../ScanCard/ScanCard'
import styles from './ProductScans.module.css'

type Props = { title: string; scans: { title: string; src: string }[] }

/**
 * «Примеры сканов» на странице сканера Artec (24.10.2026): настоящие модели, снятые этим
 * сканером, их можно покрутить. Модель грузится только по нажатию — страница не тяжелеет.
 */
export function ProductScans({ title, scans }: Props) {
  return (
    <ProductSection
      title="Примеры сканов"
      id="scans"
      sub={`Модели, снятые сканером ${title}. Нажмите, чтобы покрутить.`}
    >
      <ul className={styles.list}>
        {scans.map((scan) => (
          <li key={scan.src}>
            <ScanCard title={scan.title} src={scan.src} />
          </li>
        ))}
      </ul>
      <p className={styles.credit}>{SCANS_CREDIT}</p>
    </ProductSection>
  )
}
