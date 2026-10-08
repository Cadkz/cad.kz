import Link from 'next/link'
import { CartProvider, CartLink } from '@/components/CartProvider'
import './styles.css'
import './cart/cart.css'
export const metadata = { title: 'CAD.kz — инженерные решения', description: 'Прототип нового сайта CAD.kz', robots: { index: false, follow: false } }
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="ru"><body><CartProvider>
    <div className="demo">Демонстрационный прототип · товары и цены учебные · заявки не отправляются</div>
    <header>
      <Link className="logo" href="/">CAD<span>.kz</span></Link>
      <nav aria-label="Основная навигация">
        <Link href="/#catalog">Каталог решений</Link><Link href="/articles">База знаний</Link>
        <CartLink/><Link href="/#consultant">Подобрать решение ↗</Link>
      </nav>
    </header>
    {children}
    <footer><Link className="logo" href="/">CAD.kz</Link><p>Программное обеспечение · Оборудование · Обучение · Услуги</p><small>Отдельный демонстрационный сайт. Интеграции отключены.</small></footer>
  </CartProvider></body></html>
}
