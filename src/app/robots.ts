import type { MetadataRoute } from 'next'
import { isProduction, siteUrl } from '@/lib/seo'

/**
 * Демо закрыто для поисковиков целиком. В рабочем режиме открыта витрина, закрыты админка,
 * API, корзина и оформление заказа; карта сайта — /sitemap.xml.
 */
export default function robots(): MetadataRoute.Robots {
  if (!isProduction()) return { rules: { userAgent: '*', disallow: '/' } }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/api/',
        '/cart',
        '/checkout',
        // Те же страницы на казахском и английском.
        '/kk/cart',
        '/kk/checkout',
        '/en/cart',
        '/en/checkout',
      ],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  }
}
