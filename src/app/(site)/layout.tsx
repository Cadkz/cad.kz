import type { Metadata } from 'next'
import { preload } from 'react-dom'
import { CartProvider } from '@/components/CartProvider/CartProvider'
import { SiteFooter } from '@/components/SiteFooter/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader/SiteHeader'
import { DEFAULT_SHARE_IMAGE, isProduction, siteUrl } from '@/lib/seo'
import '@/styles/fonts.css'
import '@/styles/tokens.css'
import '@/styles/base.css'

/** Общие метаданные. В демо поисковикам закрыто всё (и заголовком в next.config.mjs). */
export function generateMetadata(): Metadata {
  const title = 'CAD.kz — софт, оборудование и обучение для проектировщиков'
  const description =
    'Программы для проектирования, широкоформатные принтеры и сканеры, 3D-сканеры, обучение ' +
    'и внедрение для проектных организаций в Казахстане.'
  return {
    metadataBase: new URL(siteUrl()),
    title,
    description,
    // Карточка ссылки в мессенджерах и соцсетях; страницы со своей обложкой заменяют картинку.
    openGraph: {
      title,
      description,
      siteName: 'CAD.kz',
      locale: 'ru_KZ',
      type: 'website',
      images: [{ url: DEFAULT_SHARE_IMAGE, width: 1200, height: 630 }],
    },
    robots: isProduction() ? { index: true, follow: true } : { index: false, follow: false },
  }
}

const criticalFonts = [
  '/fonts/manrope-cyrillic-wght-normal.woff2',
  '/fonts/inter-cyrillic-wght-normal.woff2',
]

export default function Layout({ children }: { children: React.ReactNode }) {
  for (const href of criticalFonts) {
    preload(href, { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' })
  }
  return (
    <html lang="ru">
      <body>
        <CartProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  )
}
