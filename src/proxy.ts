import { type NextRequest, NextResponse } from 'next/server'
import { isLegacyPath, LEGACY_PATH_HEADER, newPagePath } from './domain/legacyRoutes.mjs'
import {
  DEFAULT_LANG,
  LANG_HEADER,
  type Lang,
  localizeHref,
  splitLangPath,
} from './i18n/locales.mjs'

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

/**
 * Языки (06.11.2026): /kk/… и /en/… — те же страницы. Приставка снимается, страница открывается
 * по русскому адресу (rewrite, в адресной строке остаётся /kk/…), а язык уходит заголовком
 * LANG_HEADER. Без приставки — русский; чужой заголовок из запроса не принимается.
 */
function withLang(request: NextRequest, lang: Lang, extra?: [string, string]) {
  const headers = new Headers(request.headers)
  headers.set(LANG_HEADER, lang)
  if (extra) headers.set(extra[0], extra[1])
  return headers
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return adminGate(request)
  const { lang, path } = splitLangPath(pathname)
  const redirectTo = (target: string) => {
    const url = new URL(localizeHref(lang, target), request.url)
    url.search = request.nextUrl.search
    return NextResponse.redirect(url, 308)
  }
  const open = (headers: Headers) => {
    if (lang === DEFAULT_LANG) return NextResponse.next({ request: { headers } })
    const url = request.nextUrl.clone()
    url.pathname = path
    return NextResponse.rewrite(url, { request: { headers } })
  }
  // У админки, API и файлов нет языковых версий: /kk/admin и т. п. — обычная «страница не найдена».
  if (lang !== DEFAULT_LANG && localizeHref(lang, path) === path) return NextResponse.next()
  // Текстовые страницы и каталог: старый адрес со слешем (/about/, /catalog/) ведёт на новый без слеша.
  const page = newPagePath(path)
  if (page && page !== path) return redirectTo(page)
  if (isLegacyPath(path)) return open(withLang(request, lang, [LEGACY_PATH_HEADER, path]))
  // Новый URL, а не nextUrl.clone(): тот сохраняет слеш в конце при сборке адреса.
  if (pathname === `/${lang}/`) return redirectTo('/')
  if (path.length > 1 && path.endsWith('/')) return redirectTo(path.replace(/\/+$/, '') || '/')
  return open(withLang(request, lang))
}

export const config = {
  // Служебные адреса, API и файлы сайта сюда не попадают; админка — только проверка входа.
  matcher: [
    '/admin',
    '/admin/:path*',
    '/((?!_next/|api/|admin|fonts/|images/|scan-posters/|icon\\.png|apple-icon\\.png|robots\\.txt|sitemap\\.xml).*)',
  ],
}
