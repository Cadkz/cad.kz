// Создаёт миграцию Payload в том составе схемы, который работает на хостинге.
// На хостинге включено облачное хранилище картинок (MEDIA_STORAGE=blob), и его плагин добавляет в таблицу
// media свой столбец. Миграцию нужно строить с включённым плагином, иначе на хостинге страница «Медиа» ломается.
// Запуск: pnpm migrate:create <имя>

import { spawnSync } from 'node:child_process'

if (!process.argv[2]) {
  console.error('Укажите имя миграции: pnpm migrate:create <имя>')
  process.exit(1)
}

const env = {
  ...process.env,
  MEDIA_STORAGE: 'blob',
  BLOB_READ_WRITE_TOKEN:
    process.env.BLOB_READ_WRITE_TOKEN || 'vercel_blob_rw_migration_placeholder',
  DB_SCHEMA_MODE: 'migrate',
}
const result = spawnSync('pnpm', ['exec', 'payload', 'migrate:create', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env,
  shell: true,
})
process.exit(result.status ?? 1)
