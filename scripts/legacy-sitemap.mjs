// Собирает из карт сайта старого cad.kz таблицу «код товара → код раздела» для старых адресов
// вида /catalog/<раздел>/<код>/. Запуск: node scripts/legacy-sitemap.mjs <карта.xml> [ещё карты…]
// Результат — src/domain/legacyCatalog.json, список публикаций src/domain/legacyPublications.json и полный список старых адресов scripts/legacy-paths.txt
// для проверки (карты сайта публичны, их можно хранить в репозитории).

import { readFileSync, writeFileSync } from 'node:fs'
import { publicationTarget } from '../src/domain/legacyPages.mjs'

const files = process.argv.slice(2)
if (!files.length) {
  console.error('Укажите файлы карт сайта: node scripts/legacy-sitemap.mjs sitemap_000.xml')
  process.exit(1)
}

const paths = new Set()
for (const file of files) {
  const xml = readFileSync(file, 'utf8')
  for (const [, loc] of xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)) {
    try {
      paths.add(new URL(loc).pathname)
    } catch {
      console.warn(`Пропущен неверный адрес: ${loc}`)
    }
  }
}

const products = {}
const sections = new Set()
const conflicts = []
for (const path of paths) {
  const parts = path.split('/').filter(Boolean)
  if (parts[0] !== 'catalog') continue
  if (parts.length === 2) sections.add(parts[1])
  if (parts.length !== 3) continue
  const [, section, code] = parts
  sections.add(section)
  if (products[code] && products[code] !== section)
    conflicts.push(`${code}: ${products[code]}, ${section}`)
  else products[code] = section
}

const sorted = Object.fromEntries(Object.entries(products).sort(([a], [b]) => a.localeCompare(b)))
const result = { products: sorted, sections: [...sections].sort() }
writeFileSync('src/domain/legacyCatalog.json', `${JSON.stringify(result, null, 2)}\n`)
writeFileSync('scripts/legacy-paths.txt', `${[...paths].sort().join('\n')}\n`)
// Новости, акции и статьи для переноса со старого сайта (админка → «Перенос со старого сайта»).
const publications = [...paths].filter((path) => publicationTarget(path)).sort()
writeFileSync('src/domain/legacyPublications.json', `${JSON.stringify(publications, null, 1)}\n`)

console.log(`Адресов в картах: ${paths.size}`)
console.log(`Товаров со старым адресом: ${Object.keys(sorted).length}, разделов: ${sections.size}`)
console.log(`Новостей, акций и статей: ${publications.length}`)
if (conflicts.length)
  console.log(`Один код в разных разделах (взят первый):\n${conflicts.join('\n')}`)
