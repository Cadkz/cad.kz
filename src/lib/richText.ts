/**
 * Простая разметка текста публикации из поля «Текст» в админке:
 * абзацы разделяются пустой строкой, «## » в начале — подзаголовок раздела,
 * строки с «- » — список, «> » — выноска. Без HTML: безопасно выводить как есть.
 */
export type Block =
  | { type: 'heading'; id: string; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'note'; text: string }

const translit: Record<string, string> = Object.fromEntries(
  'а:a б:b в:v г:g д:d е:e ё:e ж:zh з:z и:i й:y к:k л:l м:m н:n о:o п:p р:r с:s т:t у:u ф:f х:h ц:c ч:ch ш:sh щ:sch ы:y э:e ю:yu я:ya'
    .split(' ')
    .map((pair) => pair.split(':') as [string, string]),
)

export function anchor(text: string) {
  return (
    text
      .toLowerCase()
      .split('')
      .map((ch) => translit[ch] ?? ch)
      .join('')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'section'
  )
}

export function parseBody(body: string | null | undefined): Block[] {
  if (!body) return []
  const used = new Map<string, number>()
  return body
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk): Block => {
      if (chunk.startsWith('## ')) {
        const text = chunk.slice(3).trim()
        const base = anchor(text)
        const n = used.get(base) ?? 0
        used.set(base, n + 1)
        return { type: 'heading', id: n ? `${base}-${n + 1}` : base, text }
      }
      const lines = chunk.split('\n').map((line) => line.trim())
      if (lines.every((line) => line.startsWith('- ')))
        return { type: 'list', items: lines.map((line) => line.slice(2)) }
      if (chunk.startsWith('> '))
        return { type: 'note', text: lines.map((l) => l.replace(/^> ?/, '')).join(' ') }
      return { type: 'paragraph', text: lines.join(' ') }
    })
}
