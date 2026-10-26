import type { MenuTab } from '@/lib/navigation'
import { MenuSections } from '../MenuSections/MenuSections'

/** На телефоне те же фильтры и карточки; дополнительных уровней производителей нет. */
export function MobileVendors({ tab, onNavigate }: { tab: MenuTab; onNavigate: () => void }) {
  return <MenuSections tab={tab} onNavigate={onNavigate} />
}
