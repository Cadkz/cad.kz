import type { Scan } from '@/domain/artecScans.mjs'
import { SCANS_CREDIT } from '@/domain/artecScans.mjs'
import { ProductSection } from '../ProductSection/ProductSection'
import { ScanGallery } from '../ScanGallery/ScanGallery'
import styles from './ProductScans.module.css'

/**
 * «Примеры сканов» на странице 3D-сканера: настоящие модели, снятые этим сканером, лентой
 * превью. Модель грузится только в окне просмотра — страница не тяжелеет. Список и порядок —
 * в админке (товар → «Примеры сканов»).
 */
export function ProductScans({ title, scans }: { title: string; scans: Scan[] }) {
  return (
    <div className={styles.wide}>
      <ProductSection
        title="Примеры сканов"
        id="scans"
        sub={`Модели, снятые сканером ${title}. Нажмите, чтобы открыть крупно и покрутить.`}
      >
        <ScanGallery scans={scans} />
        <p className={styles.credit}>{SCANS_CREDIT}</p>
      </ProductSection>
    </div>
  )
}
