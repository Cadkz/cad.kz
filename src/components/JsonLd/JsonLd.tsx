import { jsonLdText } from '@/domain/structuredData.mjs'

/**
 * Разметка schema.org для поисковиков (`src/domain/structuredData.mjs`). Ничего не показывает.
 * Пустые данные (нет крошек, нет вопросов) — тега нет.
 */
export function JsonLd({ data }: { data: object | null }) {
  if (!data) return null
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD — данные, а не разметка; «<» экранирован в jsonLdText (рекомендация Next.js)
      dangerouslySetInnerHTML={{ __html: jsonLdText(data) }}
    />
  )
}
