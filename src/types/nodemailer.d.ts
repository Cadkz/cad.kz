/**
 * Минимальные типы nodemailer 9 — только то, чем пользуется src/lib/mail.ts. Свои типы пакет
 * не поставляет, а @types/nodemailer описывают другую версию: лишняя зависимость не нужна.
 */
declare module 'nodemailer' {
  type Attachment = { filename: string; content: Buffer; contentType?: string }
  type MailOptions = {
    from: string
    to: string | string[]
    subject: string
    text: string
    attachments?: Attachment[]
  }
  type SentInfo = { messageId: string; accepted: (string | { address: string })[] }
  type TransportOptions = {
    host: string
    port: number
    secure: boolean
    auth?: { user: string; pass: string }
    connectionTimeout?: number
    greetingTimeout?: number
    socketTimeout?: number
  }
  type Transporter = {
    sendMail(options: MailOptions): Promise<SentInfo>
    verify(): Promise<true>
    close(): void
  }
  export function createTransport(options: TransportOptions): Transporter
  const nodemailer: { createTransport: typeof createTransport }
  export default nodemailer
}
