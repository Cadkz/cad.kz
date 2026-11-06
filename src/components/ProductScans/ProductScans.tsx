import type { Scan } from '@/domain/artecScans.mjs'
import { SCANS_CREDIT } from '@/domain/artecScans.mjs'
import { getT } from '@/i18n/server'
import { ProductSection } from '../ProductSection/ProductSection'
import { ScanGallery } from '../ScanGallery/ScanGallery'
import styles from './ProductScans.module.css'

/**
 * «Примеры сканов» на странице 3D-сканера: настоящие модели, снятые этим сканером, лентой
 * превью. Модель грузится только в окне просмотра — страница не тяжелеет. Список и порядок —
 * в админке (товар → «Примеры сканов»).
 */
export async function ProductScans({ title, scans }: { title: string; scans: Scan[] }) {
  const t = await getT()
  return (
    <ProductSection
      title={t('Примеры сканов')}
      id="scans"
      sub={t('Модели, снятые сканером {name}. Нажмите, чтобы открыть крупно и покрутить.', {
        name: title,
      })}
    >
      <ScanGallery scans={scans} />
      <p className={styles.credit}>{t(SCANS_CREDIT)}</p>
    </ProductSection>
  )
}
