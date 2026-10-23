// Сборка на Vercel. Если в настройках проекта включено DEMO_AUTO_SETUP=yes, перед сборкой сайта
// применяются миграции из src/migrations, а в пустую базу грузятся демоданные и создаётся
// первый администратор. Так демо запускается без терминала. Без этой переменной просто next build.
// Превью веток (VERCEL_ENV=preview) работают с той же базой, что и сайт, поэтому миграции и
// разовые настройки там не запускаются: базу меняет только сборка main (случай PR №1, 22.10.2026,
// когда превью ветки переименовало разделы на демо до слияния).

import { spawnSync } from 'node:child_process'

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: true })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

const preview = process.env.VERCEL_ENV === 'preview'
if (process.env.DEMO_AUTO_SETUP === 'yes' && preview)
  console.log('Превью ветки: миграции и разовые настройки пропущены, общая база не меняется.')
if (process.env.DEMO_AUTO_SETUP === 'yes' && !preview) {
  if (process.env.APP_MODE !== 'demo') {
    console.error('DEMO_AUTO_SETUP=yes работает только вместе с APP_MODE=demo.')
    process.exit(1)
  }
  run('node', ['scripts/demo-setup.mjs', '--first-time'])
}
run('pnpm', ['exec', 'next', 'build'])
