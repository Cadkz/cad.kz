// @ts-check
import { crc32, deflateRawSync } from 'node:zlib'

/**
 * Архив .zip без сторонних библиотек: файлы сжимаются deflate, имена в UTF-8. Нужен для архива
 * аналитики на почту (src/lib/analyticsArchive.ts): несколько CSV одним вложением.
 * Формат — PKWARE APPNOTE, без zip64: архив аналитики много меньше 4 ГБ.
 */

/** @typedef {{ name: string, data: string | Uint8Array }} ZipFile */

/** Дата и время в формате DOS (как их хранит zip), по часам Казахстана (UTC+5). */
function dosStamp(/** @type {Date} */ when) {
  const local = new Date(when.getTime() + 5 * 3_600_000)
  const year = Math.max(local.getUTCFullYear(), 1980)
  const time =
    (local.getUTCHours() << 11) | (local.getUTCMinutes() << 5) | (local.getUTCSeconds() >> 1)
  const date = ((year - 1980) << 9) | ((local.getUTCMonth() + 1) << 5) | local.getUTCDate()
  return { time, date }
}

/** Бит 11 — имя файла в UTF-8. */
const UTF8_NAMES = 0x0800
const DEFLATE = 8
const VERSION = 20

/**
 * Собирает архив .zip.
 * @param {ZipFile[]} files
 * @param {Date} [when]  дата изменения файлов внутри архива
 * @returns {Buffer}
 */
export function createZip(files, when = new Date()) {
  const { time, date } = dosStamp(when)
  /** @type {Buffer[]} */
  const parts = []
  /** @type {Buffer[]} */
  const central = []
  let offset = 0
  for (const file of files) {
    const name = Buffer.from(file.name, 'utf8')
    const raw = typeof file.data === 'string' ? Buffer.from(file.data, 'utf8') : file.data
    const packed = deflateRawSync(raw, { level: 9 })
    const crc = crc32(raw)

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(VERSION, 4)
    local.writeUInt16LE(UTF8_NAMES, 6)
    local.writeUInt16LE(DEFLATE, 8)
    local.writeUInt16LE(time, 10)
    local.writeUInt16LE(date, 12)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(packed.length, 18)
    local.writeUInt32LE(raw.length, 22)
    local.writeUInt16LE(name.length, 26)
    local.writeUInt16LE(0, 28)
    parts.push(local, name, packed)

    const entry = Buffer.alloc(46)
    entry.writeUInt32LE(0x02014b50, 0)
    entry.writeUInt16LE(VERSION, 4)
    entry.writeUInt16LE(VERSION, 6)
    entry.writeUInt16LE(UTF8_NAMES, 8)
    entry.writeUInt16LE(DEFLATE, 10)
    entry.writeUInt16LE(time, 12)
    entry.writeUInt16LE(date, 14)
    entry.writeUInt32LE(crc, 16)
    entry.writeUInt32LE(packed.length, 20)
    entry.writeUInt32LE(raw.length, 24)
    entry.writeUInt16LE(name.length, 28)
    // Дополнительные поля, комментарий, номер диска, атрибуты — нули.
    entry.writeUInt32LE(offset, 42)
    central.push(entry, name)

    offset += local.length + name.length + packed.length
  }
  const centralSize = central.reduce((sum, part) => sum + part.length, 0)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(files.length, 8)
  end.writeUInt16LE(files.length, 10)
  end.writeUInt32LE(centralSize, 12)
  end.writeUInt32LE(offset, 16)
  return Buffer.concat([...parts, ...central, end])
}
