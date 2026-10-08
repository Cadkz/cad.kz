// Одна команда для демо-базы: применяет миграции, загружает демоданные и создаёт первого администратора.
// Запуск: pnpm demo:setup
// Строка подключения берётся из файла .env (или из окружения) и нигде не печатается.

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'

if (existsSync('.env')) process.loadEnvFile('.env')

const url = process.env.DATABASE_URL
if (!url || !process.env.PAYLOAD_SECRET) {
  console.error(
    'В файле .env должны быть заданы DATABASE_URL и PAYLOAD_SECRET. Подробнее: docs/STAGING.md.',
  )
  process.exit(1)
}

let host = 'неизвестно'
try {
  host = new URL(url).hostname
} catch {
  console.error('DATABASE_URL записан неверно: скопируйте строку подключения из Neon целиком.')
  process.exit(1)
}
console.log(`База: ${host}`)

// Схему меняют только миграции, автоподгонка таблиц отключена.
const env = { ...process.env, APP_MODE: 'demo', DB_SCHEMA_MODE: 'migrate' }

function run(title, args, { required = true } = {}) {
  console.log(`\n== ${title}`)
  const result = spawnSync('pnpm', ['exec', 'payload', ...args], {
    stdio: 'inherit',
    env,
    shell: true,
  })
  if (result.status === 0) return true
  if (required) {
    console.error(`\nШаг «${title}» не удался. Дальше не продолжаем.`)
    process.exit(result.status ?? 1)
  }
  return false
}

run('1 из 3. Создание таблиц (миграции)', ['migrate'])
run('2 из 3. Загрузка демоданных', ['run', 'scripts/seed-demo.mjs'])

if (process.env.BOOTSTRAP_ADMIN_EMAIL && process.env.BOOTSTRAP_ADMIN_PASSWORD) {
  const created = run('3 из 3. Первый администратор', ['run', 'scripts/bootstrap-admin.mjs'], {
    required: false,
  })
  if (!created) console.log('Администратор не создан: возможно, он уже есть. Остальное выполнено.')
} else {
  console.log(
    '\n== 3 из 3. Первый администратор пропущен: BOOTSTRAP_ADMIN_EMAIL и BOOTSTRAP_ADMIN_PASSWORD не заданы.',
  )
}

console.log('\nГотово. Удалите BOOTSTRAP_ADMIN_EMAIL и BOOTSTRAP_ADMIN_PASSWORD из файла .env.')
