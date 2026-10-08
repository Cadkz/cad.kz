import { withPayload } from '@payloadcms/next/withPayload'

// Демо не должно попадать в поиск: запрет индексации передаётся и заголовком на все адреса,
// включая админку и API, и отдельно в robots.txt и мета-теге.
const noIndexHeaders = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }]

export default withPayload({
  poweredByHeader: false,
  // Слеш в конце адреса обрабатывает src/proxy.ts: старые адреса товаров cad.kz сохраняются со слешем.
  skipTrailingSlashRedirect: true,
  images: {
    // Картинки CMS при хранении в Vercel Blob.
    remotePatterns: [{ protocol: 'https', hostname: '*.public.blob.vercel-storage.com' }],
  },
  async headers() {
    if (process.env.APP_MODE !== 'demo') return []
    return [{ source: '/:path*', headers: noIndexHeaders }]
  },
})
