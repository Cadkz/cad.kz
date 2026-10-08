// Сборка на Vercel. Если в настройках проекта включено DEMO_AUTO_SETUP=yes, перед сборкой сайта
// применяются миграции из src/migrations, а в пустую базу грузятся демоданные и создаётся
// первый администратор. Так демо запускается без терминала. Без этой переменной просто next build.

import { spawnSync } from 'node:child_process'

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: true })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

if (process.env.DEMO_AUTO_SETUP === 'yes') {
  if (process.env.APP_MODE !== 'demo') {
    console.error('DEMO_AUTO_SETUP=yes работает только вместе с APP_MODE=demo.')
    process.exit(1)
  }
  run('node', ['scripts/demo-setup.mjs', '--first-time'])
}
run('pnpm', ['exec', 'next', 'build'])
