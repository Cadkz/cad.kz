// Проверка дизайн-системы: в стилях компонентов разрешены только токены из src/styles/tokens.css.
// Запуск: pnpm check:styles (входит в pnpm check). Падает с кодом 1 при нарушениях.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const SRC = join(ROOT, 'src')

// Файлы, где сырые значения разрешены по определению.
const TOKEN_FILES = new Set(['src/styles/tokens.css', 'src/styles/fonts.css'])

// Старая вёрстка прототипа. Удалить из списка вместе с файлом при переносе страницы на макет.
const LEGACY_FILES = new Set([])

const ALLOWED_BREAKPOINTS = new Set(['640px', '960px', '1200px'])

const CSS_RULES = [
  { name: 'цвет не из токенов', pattern: /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/gi },
  { name: 'font-size не из токенов', pattern: /font-size\s*:(?!\s*var\()[^;]+/gi },
  { name: 'font-weight не из токенов', pattern: /font-weight\s*:\s*\d+/gi },
  { name: 'font-family не из токенов', pattern: /font-family\s*:(?!\s*(?:var\(|inherit))[^;]+/gi },
  {
    name: 'border-radius не из токенов',
    pattern: /border-radius\s*:(?!\s*(?:var\(|0\b|inherit))[^;]+/gi,
  },
  { name: 'box-shadow не из токенов', pattern: /box-shadow\s*:(?!\s*(?:var\(|none))[^;]+/gi },
  { name: 'z-index не из токенов', pattern: /z-index\s*:\s*-?\d+/gi },
]

const TSX_RULES = [
  { name: 'inline style', pattern: /\sstyle=\{\{/g },
  { name: 'цвет в коде компонента', pattern: /['"]#[0-9a-f]{3,8}['"]/gi },
]

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length
}

function checkFile(path, rules, problems) {
  const text = readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\//g, (c) =>
    c.replace(/[^\n]/g, ' '),
  )
  const file = relative(ROOT, path)
  for (const rule of rules) {
    for (const match of text.matchAll(rule.pattern)) {
      problems.push(`${file}:${lineOf(text, match.index)}  ${rule.name}: ${match[0].trim()}`)
    }
  }
  if (path.endsWith('.css')) {
    for (const match of text.matchAll(/@media[^{]*\(\s*(?:min|max)-width\s*:\s*([\d.]+px)/g)) {
      if (!ALLOWED_BREAKPOINTS.has(match[1])) {
        problems.push(
          `${file}:${lineOf(text, match.index)}  брейкпоинт ${match[1]} (разрешены 640/960/1200)`,
        )
      }
    }
  }
}

const problems = []
for (const path of walk(SRC)) {
  const file = relative(ROOT, path)
  if (TOKEN_FILES.has(file) || LEGACY_FILES.has(file)) continue
  if (path.endsWith('.css')) checkFile(path, CSS_RULES, problems)
  if (path.endsWith('.tsx')) checkFile(path, TSX_RULES, problems)
}

if (problems.length) {
  console.error(
    `Нарушения дизайн-системы (${problems.length}). Используйте токены из src/styles/tokens.css:\n`,
  )
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log(`Дизайн-система: нарушений нет. Старых файлов вне проверки: ${LEGACY_FILES.size}.`)
