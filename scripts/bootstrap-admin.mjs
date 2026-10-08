// Создаёт первого администратора в пустой БД.
// Запуск: BOOTSTRAP_ADMIN_EMAIL=… BOOTSTRAP_ADMIN_PASSWORD=… pnpm payload run scripts/bootstrap-admin.mjs

import config from '@payload-config'
import { getPayload } from 'payload'

const email = process.env.BOOTSTRAP_ADMIN_EMAIL
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD
if (!email || !password || password.length < 16)
  throw new Error(
    'Задайте BOOTSTRAP_ADMIN_EMAIL и пароль длиной не менее 16 символов в локальном окружении',
  )
const payload = await getPayload({ config })
try {
  const existing = await payload.count({ collection: 'users', overrideAccess: true })
  if (existing.totalDocs !== 0)
    throw new Error('Пользователи уже существуют. Bootstrap разрешён только для пустой БД.')
  await payload.create({
    collection: 'users',
    overrideAccess: true,
    data: { email, password, role: 'admin' },
  })
  console.log('Первый администратор создан. Удалите BOOTSTRAP_ADMIN_* из окружения.')
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await payload.destroy()
  // Пул соединений Payload держит процесс открытым — завершаем явно.
  process.exit(process.exitCode ?? 0)
}
