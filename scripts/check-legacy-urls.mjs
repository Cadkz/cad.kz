// Проверка старых адресов cad.kz на новом сайте: ни один не должен отдавать ошибку.
// Запуск: node scripts/check-legacy-urls.mjs https://cad-kz.vercel.app [список.txt]
// Для каждого адреса из scripts/legacy-paths.txt идём по перенаправлениям (не больше 3)
// и ждём итог 200. Печатаем сводку и все проблемные адреса.

import { readFileSync } from 'node:fs'

const base = process.argv[2]
const listFile = process.argv[3] ?? 'scripts/legacy-paths.txt'
if (!base) {
  console.error('Укажите адрес сайта: node scripts/check-legacy-urls.mjs https://cad-kz.vercel.app')
  process.exit(1)
}

const paths = readFileSync(listFile, 'utf8').split('\n').filter(Boolean)

async function check(path) {
  let url = new URL(path, base)
  const chain = []
  for (let hop = 0; hop < 4; hop++) {
    const response = await fetch(url, { redirect: 'manual' })
    chain.push(response.status)
    const location = response.headers.get('location')
    if (response.status >= 300 && response.status < 400 && location) {
      url = new URL(location, url)
      continue
    }
    return { path, status: response.status, final: url.pathname + url.search, chain }
  }
  return { path, status: 'много перенаправлений', final: url.pathname, chain }
}

const results = []
let next = 0
async function worker() {
  while (next < paths.length) {
    const path = paths[next++]
    try {
      results.push(await check(path))
    } catch (error) {
      results.push({ path, status: `ошибка сети: ${error.message}`, final: '', chain: [] })
    }
  }
}
await Promise.all(Array.from({ length: 8 }, worker))

const kept = results.filter((r) => r.status === 200 && r.chain.length === 1)
const moved = results.filter((r) => r.status === 200 && r.chain.length === 2)
const long = results.filter((r) => r.status === 200 && r.chain.length > 2)
const failed = results.filter((r) => r.status !== 200)

console.log(`Проверено адресов: ${results.length}`)
console.log(`Открываются по прежнему адресу: ${kept.length}`)
console.log(`Перенаправлены одним шагом: ${moved.length}`)
console.log(`Перенаправлены в несколько шагов: ${long.length}`)
console.log(`С ошибкой: ${failed.length}`)
for (const r of [...long, ...failed])
  console.log(
    `  ${r.path} → ${r.final} (${r.chain.join(' → ')}${r.status === 200 ? '' : `, ${r.status}`})`,
  )

const targets = new Map()
for (const r of moved) targets.set(r.final, (targets.get(r.final) ?? 0) + 1)
console.log('\nКуда ведут перенаправления (самые частые):')
for (const [target, count] of [...targets].sort((a, b) => b[1] - a[1]).slice(0, 15))
  console.log(`  ${count} → ${target}`)

process.exit(failed.length ? 1 : 0)
