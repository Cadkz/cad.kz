import { type ReactNode, ViewTransition } from 'react'
import { PAGE_BACK, PAGE_FORWARD } from '@/domain/motion.mjs'

const IN = { [PAGE_FORWARD]: 'list-in-right', [PAGE_BACK]: 'list-in-left', default: 'none' }
const OUT = { [PAGE_FORWARD]: 'list-out-left', [PAGE_BACK]: 'list-out-right', default: 'none' }

type Props = {
  /** Номер страницы: новый номер — новый список, старый уходит, новый приходит. */
  page: number
  children: ReactNode
}

/**
 * Список карточек одной страницы каталога (этап 2 анимаций, 02.11.2026): при листании вперёд
 * список уходит влево и новый приходит справа, назад — наоборот, на 24 px, как переход вглубь
 * сайта. Остальные переходы — без анимации.
 */
export function FlowPage({ page, children }: Props) {
  return (
    <ViewTransition key={page} default="none" enter={IN} exit={OUT}>
      {children}
    </ViewTransition>
  )
}
