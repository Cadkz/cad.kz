import { type NextRequest, NextResponse } from 'next/server'
import { isLegacyPath, LEGACY_PATH_HEADER } from './domain/legacyRoutes.mjs'

/**
 * Слеш в конце адреса. Старые адреса cad.kz заканчиваются слешем, и товары открываются по ним
 * без изменений, поэтому стандартная обработка Next.js выключена (skipTrailingSlashRedirect).
 * Старые адреса уходят как есть на страницу старых адресов — она сразу ведёт на нужную страницу,
 * без лишнего промежуточного перенаправления. У адресов нового сайта слеш в конце убирается.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
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
  // Служебные адреса, админка, API и файлы сайта сюда не попадают.
  matcher: ['/((?!_next/|api/|admin|fonts/|images/|icon\\.png|apple-icon\\.png|robots\\.txt).*)'],
}
