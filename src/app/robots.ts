import type { MetadataRoute } from 'next'

/** В демо поисковикам закрыт весь сайт. Когда появится рабочий режим, правила откроют нужные разделы. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', disallow: '/' } }
}
