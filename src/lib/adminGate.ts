import { redirect } from 'next/navigation'
import type { PayloadRequest } from 'payload'

/**
 * Свои страницы админки — только после входа (требование владельца 30.10.2026). Payload сам
 * закрывает только свои разделы, свои страницы рисуются и без входа — с меню и разделами.
 * Нет пользователя (не входили или вход просрочен) — на страницу входа, после входа обратно.
 * Первую проверку (нет cookie входа) делает src/proxy.ts.
 */
export function requireLogin(req: PayloadRequest) {
  if (req.user) return
  let back = '/admin'
  try {
    const url = new URL(req.url ?? '', 'http://site')
    if (url.pathname.startsWith('/admin')) back = `${url.pathname}${url.search}`
  } catch {
    // Адреса нет — после входа на главную админки.
  }
  redirect(`/admin/login?redirect=${encodeURIComponent(back)}`)
}
