import type { Metadata } from 'next'
import { preload } from 'react-dom'
import { CartProvider } from '@/components/CartProvider/CartProvider'
import { KaddiStage } from '@/components/KaddiStage/KaddiStage'
import { LangProvider } from '@/components/LangProvider/LangProvider'
import { PageTransition } from '@/components/PageTransition/PageTransition'
import { RevealObserver } from '@/components/RevealObserver/RevealObserver'
import { SiteFooter } from '@/components/SiteFooter/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader/SiteHeader'
import { THEME_INIT_SCRIPT } from '@/domain/siteTheme.mjs'
import { DEFAULT_LANG, INDEX_TRANSLATIONS, OG_LOCALES } from '@/i18n/locales.mjs'
import { messagesFor } from '@/i18n/messages'
import { getLang, getT } from '@/i18n/server'
import { DEFAULT_SHARE_IMAGE, isProduction, siteUrl } from '@/lib/seo'
import '@/styles/fonts.css'
import '@/styles/tokens.css'
import '@/styles/base.css'

/** Общие метаданные. В демо поисковикам закрыто всё (и заголовком в next.config.mjs). */
export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang()
  const t = await getT()
  const title = t('CAD.kz — программы, оборудование и обучение для проектировщиков')
  const description = t(
    'Программы для проектирования, широкоформатные принтеры и сканеры, 3D-сканеры, обучение и внедрение для проектных организаций в Казахстане.',
  )
  return {
    metadataBase: new URL(siteUrl()),
    title,
    description,
    // Карточка ссылки в мессенджерах и соцсетях; страницы со своей обложкой заменяют картинку.
    openGraph: {
      title,
      description,
      siteName: 'CAD.kz',
      locale: OG_LOCALES[lang],
      type: 'website',
      images: [{ url: DEFAULT_SHARE_IMAGE, width: 1200, height: 630 }],
    },
    // Казахская и английская версии закрыты, пока не переведены товары (INDEX_TRANSLATIONS).
    robots:
      isProduction() && (lang === DEFAULT_LANG || INDEX_TRANSLATIONS)
        ? { index: true, follow: true }
        : { index: false, follow: isProduction() },
  }
}

// Один корпоративный шрифт Golos Text. На первом экране нужна кириллица и латиница: в латинском
// файле пробел, цифры и знаки препинания, без него не рисуется ни один абзац. Без предзагрузки браузер
// узнаёт о нём только из стилей, и первый текст ждал лишний шаг (PageSpeed, 21.10.2026).
const criticalFonts = [
  '/fonts/golos-text-cyrillic-wght-normal.woff2',
  '/fonts/golos-text-latin-wght-normal.woff2',
]

export default async function Layout({ children }: { children: React.ReactNode }) {
  const lang = await getLang()
  for (const href of criticalFonts) {
    preload(href, { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' })
  }
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: статический скрипт без пользовательских данных, до первого кадра */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <LangProvider lang={lang} messages={messagesFor(lang)}>
          <CartProvider>
            <SiteHeader />
            <PageTransition>{children}</PageTransition>
            <SiteFooter />
          </CartProvider>
          <RevealObserver />
          <KaddiStage />
        </LangProvider>
      </body>
    </html>
  )
}
