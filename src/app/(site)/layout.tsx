import Link from 'next/link'
import { preload } from 'react-dom'
import { CartLink, CartProvider } from '@/components/CartProvider'
import '@/styles/fonts.css'
import '@/styles/tokens.css'
import '@/styles/base.css'
import './styles.css'
import './cart/cart.css'
export const metadata = {
  title: 'CAD.kz — инженерные решения',
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
          <div className="demo">
            Демонстрационный прототип · товары и цены учебные · заявки не отправляются
          </div>
          <header>
            <Link className="logo" href="/">
              CAD<span>.kz</span>
            </Link>
            <nav aria-label="Основная навигация">
              <Link href="/#catalog">Каталог решений</Link>
              <Link href="/articles">База знаний</Link>
              <CartLink />
              <Link href="/#consultant">Подобрать решение ↗</Link>
            </nav>
          </header>
          {children}
          <footer>
            <Link className="logo" href="/">
              CAD.kz
            </Link>
            <p>Программное обеспечение · Оборудование · Обучение · Услуги</p>
            <small>Отдельный демонстрационный сайт. Интеграции отключены.</small>
          </footer>
        </CartProvider>
      </body>
    </html>
  )
}
