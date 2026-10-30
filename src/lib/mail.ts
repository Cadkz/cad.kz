import nodemailer from 'nodemailer'

/**
 * Отправка писем с сайта через почтовый сервер (SMTP). Настройки — только в переменных окружения
 * (.env локально, Vercel → Settings → Environment Variables на хостинге):
 * SMTP_HOST, SMTP_PORT (465 — шифрование сразу, 587 — STARTTLS), SMTP_USER, SMTP_PASSWORD
 * (пароль приложения почты, не обычный пароль), MAIL_FROM — от кого (пусто — SMTP_USER).
 */

type MailSettings = { host: string; port: number; user: string; pass: string; from: string }

function settings(): MailSettings | null {
  const host = process.env.SMTP_HOST?.trim()
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASSWORD
  if (!host || !user || !pass) return null
  const port = Number(process.env.SMTP_PORT?.trim() || 465)
  const from = process.env.MAIL_FROM?.trim() || `CAD.kz <${user}>`
  return { host, port: Number.isInteger(port) && port > 0 ? port : 465, user, pass, from }
}

/** Почта настроена: есть сервер, логин и пароль. */
export function mailConfigured() {
  return settings() !== null
}

/** Сервер и отправитель без пароля — показать администратору, куда подключён сайт. */
export function mailSummary() {
  const found = settings()
  return found ? { host: found.host, port: found.port, from: found.from } : null
}

export type MailMessage = {
  to: string[]
  subject: string
  text: string
  attachments?: { filename: string; content: Buffer; contentType?: string }[]
}

/** Короткие таймауты: функция Vercel не должна висеть, если почтовый сервер молчит. */
const TIMEOUTS = { connectionTimeout: 15_000, greetingTimeout: 15_000, socketTimeout: 30_000 }

/**
 * Отправляет письмо. Ошибку переводит в понятный текст: её увидит администратор на странице
 * «Аналитика», поэтому без пароля и технических подробностей сервера.
 */
export async function sendMail(
  message: MailMessage,
): Promise<{ ok: true; accepted: number } | { ok: false; error: string }> {
  const found = settings()
  if (!found)
    return {
      ok: false,
      error: 'Почта сайта не настроена: нет SMTP_HOST, SMTP_USER или SMTP_PASSWORD.',
    }
  const transport = nodemailer.createTransport({
    host: found.host,
    port: found.port,
    secure: found.port === 465,
    auth: { user: found.user, pass: found.pass },
    ...TIMEOUTS,
  })
  try {
    const info = await transport.sendMail({ from: found.from, ...message })
    return { ok: true, accepted: info.accepted.length }
  } catch (error) {
    console.error('Почта: письмо не отправлено', error)
    return { ok: false, error: mailError(error) }
  } finally {
    transport.close()
  }
}

/** Причина ошибки почты простыми словами. */
function mailError(error: unknown) {
  const code =
    error && typeof error === 'object' && 'code' in error ? String(error.code) : 'неизвестно'
  const command =
    error && typeof error === 'object' && 'responseCode' in error
      ? Number(error.responseCode)
      : null
  if (code === 'EAUTH' || command === 535)
    return 'Почтовый сервер не принял логин или пароль. Проверьте SMTP_USER и SMTP_PASSWORD (нужен пароль приложения).'
  if (code === 'ETIMEDOUT' || code === 'ECONNECTION' || code === 'ESOCKET')
    return 'Не удалось связаться с почтовым сервером. Проверьте SMTP_HOST и SMTP_PORT.'
  if (code === 'EENVELOPE' || command === 550 || command === 553)
    return 'Почтовый сервер отказался отправить письмо. Проверьте MAIL_FROM: адрес отправителя должен совпадать с ящиком SMTP_USER.'
  if (command === 552) return 'Почтовый сервер отклонил письмо из-за размера вложения.'
  return `Письмо не отправлено (код ошибки: ${code}${command ? `, ответ сервера ${command}` : ''}).`
}
