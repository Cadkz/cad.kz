import { preload } from 'react-dom'
import { CartProvider } from '@/components/CartProvider/CartProvider'
import { SiteFooter } from '@/components/SiteFooter/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader/SiteHeader'
import '@/styles/fonts.css'
import '@/styles/tokens.css'
import '@/styles/base.css'
import './styles.css'
import './cart/cart.css'

export const metadata = {
  title: 'CAD.kz — софт, оборудование и обучение для проектировщиков',
  description: 'Прототип нового сайта CAD.kz',
  robots: { index: false, follow: false },
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
