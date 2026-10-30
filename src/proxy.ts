import { type NextRequest, NextResponse } from 'next/server'
import { isLegacyPath, LEGACY_PATH_HEADER, newPagePath } from './domain/legacyRoutes.mjs'

/**
 * Слеш в конце адреса. Старые адреса cad.kz заканчиваются слешем, и товары открываются по ним
 * без изменений, поэтому стандартная обработка Next.js выключена (skipTrailingSlashRedirect).
 * Старые адреса уходят как есть на страницу старых адресов — она сразу ведёт на нужную страницу,
 * без лишнего промежуточного перенаправления. У адресов нового сайта слеш в конце убирается.
 */
/**
 * Админка — только после входа (требование владельца 30.10.2026): без входа любая ссылка на
 * админку сразу ведёт на страницу входа, а после входа — туда, куда вела ссылка. Свои страницы
 * админки (Каталог, Цены, Курсы…) Payload сам не закрывает: без этой проверки было видно меню
 * и разделы. Здесь — быстрая проверка, что есть cookie входа; просроченный вход ловят сами
 * страницы (src/lib/adminGate.ts).
 */
const ADMIN_OPEN =
  /^\/admin\/(login|logout|logout-inactivity|forgot|reset|create-first-user|verify)(\/|$)/

function adminGate(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  if (ADMIN_OPEN.test(pathname) || request.cookies.get('payload-token')?.value)
    return NextResponse.next()
  const login = new URL('/admin/login', request.url)
  login.searchParams.set('redirect', `${pathname}${search}`)
  return NextResponse.redirect(login, 307)
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return adminGate(request)
  // Текстовые страницы и каталог: старый адрес со слешем (/about/, /catalog/) ведёт на новый без слеша.
  const page = newPagePath(pathname)
  if (page && page !== pathname) {
    const target = new URL(page, request.url)
    target.search = request.nextUrl.search
    return NextResponse.redirect(target, 308)
  }
  if (isLegacyPath(pathname)) {
    const headers = new Headers(request.headers)
    headers.set(LEGACY_PATH_HEADER, pathname)
    return NextResponse.next({ request: { headers } })
  }
  if (pathname.length > 1 && pathname.endsWith('/')) {
    // Новый URL, а не nextUrl.clone(): тот сохраняет слеш в конце при сборке адреса.
    const target = new URL(pathname.replace(/\/+$/, '') || '/', request.url)
    target.search = request.nextUrl.search
    return NextResponse.redirect(target, 308)
  }
  return NextResponse.next()
}

export const config = {
  // Служебные адреса, API и файлы сайта сюда не попадают; админка — только проверка входа.
  matcher: [
    '/admin',
    '/admin/:path*',
    '/((?!_next/|api/|admin|fonts/|images/|scan-posters/|icon\\.png|apple-icon\\.png|robots\\.txt|sitemap\\.xml).*)',
  ],
}
