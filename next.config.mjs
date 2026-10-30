import { withPayload } from '@payloadcms/next/withPayload'

// Демо не должно попадать в поиск: запрет индексации передаётся и заголовком на все адреса,
// включая админку и API, и отдельно в robots.txt и мета-теге.
const noIndexHeaders = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }]

export default withPayload({
  poweredByHeader: false,
  // Слеш в конце адреса обрабатывает src/proxy.ts: старые адреса товаров cad.kz сохраняются со слешем.
  skipTrailingSlashRedirect: true,
  // PDF характеристик (src/lib/specSheetPdf.ts): pdfkit читает свои файлы с диска — не собирать его
  // в бандл, а брать из node_modules; шрифты TTF для PDF кладём в функцию явно.
  serverExternalPackages: ['pdfkit'],
  outputFileTracingIncludes: {
    '/products/\\[slug\\]/specs.pdf': [
      './src/assets/fonts/*.ttf',
      './node_modules/pdfkit/js/data/**/*',
    ],
  },
  images: {
    // Картинки CMS при хранении в Vercel Blob.
    remotePatterns: [{ protocol: 'https', hostname: '*.public.blob.vercel-storage.com' }],
  },
  async headers() {
    if (process.env.APP_MODE !== 'demo') return []
    return [{ source: '/:path*', headers: noIndexHeaders }]
  },
})
