'use client'

import { useEffect } from 'react'
import { CATALOG_PATH } from '@/lib/navigationHrefs'

/**
 * Старые ссылки вида /#catalog: каталог раньше был на главной. Часть адреса после # сервер
 * не видит, поэтому переход на /catalog делает браузер. Ссылки с условиями фильтра
 * (/?direction=…#catalog) перенаправляет сервер.
 */
export function CatalogHashRedirect() {
  useEffect(() => {
    if (window.location.hash === '#catalog') window.location.replace(CATALOG_PATH)
  }, [])
  return null
}
