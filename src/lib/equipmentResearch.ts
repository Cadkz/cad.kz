/** Проверка JSON из CMS: незаполненные данные не участвуют в фильтре. */
export type ResearchData = {
  category: string
  filters: Record<string, string[]>
  status: string
  replacedBy: string | null
}

export function readResearch(value: unknown): ResearchData | null {
  if (!value || typeof value !== 'object' || !('category' in value)) return null
  if (typeof value.category !== 'string') return null
  const raw = 'filters' in value ? value.filters : null
  const filters: Record<string, string[]> = {}
  if (raw && typeof raw === 'object') {
    for (const [key, entry] of Object.entries(raw)) {
      const values = Array.isArray(entry) ? entry : [entry]
      const strings = values.filter((item): item is string => typeof item === 'string' && !!item)
      if (strings.length) filters[key] = [...new Set(strings)]
    }
  }
  return {
    category: value.category,
    filters,
    status: 'status' in value && typeof value.status === 'string' ? value.status : 'unknown',
    replacedBy:
      'replacedBy' in value && typeof value.replacedBy === 'string' ? value.replacedBy : null,
  }
}

export type Lifecycle = { replacement: { title: string; href: string | null } | null }

/** Отсутствие цены не означает снятие с продажи. Скрываем только явно снятые модели. */
export function catalogAvailable(product: { status?: string; researchData?: unknown }) {
  return (
    product.status === 'published' && readResearch(product.researchData)?.status !== 'discontinued'
  )
}

/** Ссылка только на опубликованную модель со своей страницей. Текстовая замена остаётся текстом. */
export function lifecycle(
  research: ResearchData | null,
  replacements: Map<string, { title: string; href: string | null }>,
): Lifecycle | null {
  if (research?.status !== 'discontinued') return null
  return {
    replacement: research.replacedBy
      ? (replacements.get(research.replacedBy) ?? { title: research.replacedBy, href: null })
      : null,
  }
}
