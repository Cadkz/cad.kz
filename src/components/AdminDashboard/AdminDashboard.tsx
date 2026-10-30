import { Gutter } from '@payloadcms/ui'
import type { AdminViewServerProps } from 'payload'
import { AdminHome } from '@/components/AdminHome/AdminHome'
import { requireLogin } from '@/lib/adminGate'

/**
 * Главная админки вместо стандартной Payload (решение владельца 30.10.2026): стандартная
 * выводила карточками все коллекции, в том числе служебные и со старыми названиями. Здесь только
 * рабочее: быстрые действия, что требует внимания, курсы и последние действия.
 */
export function AdminDashboard({ initPageResult }: AdminViewServerProps) {
  const { req } = initPageResult
  requireLogin(req)
  return (
    <Gutter>
      <AdminHome payload={req.payload} user={req.user ?? undefined} />
    </Gutter>
  )
}
