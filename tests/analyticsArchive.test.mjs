import assert from 'node:assert/strict'
import { test } from 'node:test'
import { crc32, inflateRawSync } from 'node:zlib'
import {
  addMonths,
  archiveFiles,
  archiveMail,
  archiveName,
  archivePeriod,
  dialogText,
  isDue,
  nextDue,
} from '../src/domain/analyticsArchive.mjs'
import { summarizeConversations, summarizeSearches } from '../src/domain/searchStats.mjs'
import { createZip } from '../src/domain/zip.mjs'

/** Читает zip по центральному каталогу — как это делают архиваторы. */
function readZip(buffer) {
  const end = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]))
  const count = buffer.readUInt16LE(end + 10)
  let at = buffer.readUInt32LE(end + 16)
  const files = new Map()
  for (let i = 0; i < count; i++) {
    assert.equal(buffer.readUInt32LE(at), 0x02014b50)
    const flags = buffer.readUInt16LE(at + 8)
    const crc = buffer.readUInt32LE(at + 16)
    const packed = buffer.readUInt32LE(at + 20)
    const size = buffer.readUInt32LE(at + 24)
    const nameLength = buffer.readUInt16LE(at + 28)
    const local = buffer.readUInt32LE(at + 42)
    const name = buffer.subarray(at + 46, at + 46 + nameLength).toString('utf8')
    assert.equal(flags & 0x0800, 0x0800, 'имя в UTF-8')
    const start = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28)
    const data = inflateRawSync(buffer.subarray(start, start + packed))
    assert.equal(data.length, size)
    assert.equal(crc32(data), crc)
    files.set(name, data.toString('utf8'))
    at += 46 + nameLength
  }
  return files
}

test('zip: файлы читаются обратно, кириллица и пустой файл', () => {
  const zip = createZip([
    { name: 'a.csv', data: '﻿"Запрос";"Раз"\r\n"автокад";3\r\n' },
    { name: 'пусто.txt', data: '' },
  ])
  const files = readZip(zip)
  assert.deepEqual([...files.keys()], ['a.csv', 'пусто.txt'])
  assert.match(files.get('a.csv') ?? '', /автокад/)
  assert.equal(files.get('пусто.txt'), '')
})

test('сроки: +4 месяца, конец месяца, високосный год', () => {
  assert.equal(
    addMonths(new Date('2026-10-30T10:00:00Z'), 4).toISOString(),
    '2027-02-28T10:00:00.000Z',
  )
  assert.equal(
    addMonths(new Date('2027-10-31T00:00:00Z'), 4).toISOString(),
    '2028-02-29T00:00:00.000Z',
  )
  assert.equal(
    addMonths(new Date('2026-06-15T00:00:00Z'), -4).toISOString(),
    '2026-02-15T00:00:00.000Z',
  )
  assert.equal(nextDue({}), null)
  assert.equal(
    nextDue({ lastSentAt: '2026-10-30T10:00:00Z' })?.toISOString(),
    '2027-02-28T10:00:00.000Z',
  )
})

test('пора ли отправлять: первый раз, рано, срок пришёл, повтор после ошибки раз в сутки', () => {
  const sent = { lastSentAt: '2026-10-30T10:00:00Z' }
  assert.equal(isDue({}, new Date('2026-10-31T03:17:00Z')), true)
  assert.equal(isDue(sent, new Date('2027-02-27T03:17:00Z')), false)
  assert.equal(isDue(sent, new Date('2027-02-28T10:00:00Z')), true)
  const failed = { ...sent, lastAttemptAt: '2027-03-01T03:17:00Z', lastError: 'нет связи' }
  assert.equal(isDue(failed, new Date('2027-03-01T09:00:00Z')), false)
  assert.equal(isDue(failed, new Date('2027-03-02T03:10:00Z')), true)
})

test('период: с прошлой отправки; первый раз — 4 месяца; не раньше срока хранения поиска', () => {
  const now = new Date('2026-10-30T10:00:00Z')
  assert.deepEqual(archivePeriod({ lastSentAt: '2026-07-01T00:00:00.000Z' }, now), {
    from: '2026-07-01T00:00:00.000Z',
    to: '2026-10-30T10:00:00.000Z',
  })
  assert.equal(archivePeriod({}, now).from, '2026-06-30T10:00:00.000Z')
  // Отправка давно не шла (почту не настроили) — данные старше 180 дней уже удалены.
  assert.equal(
    archivePeriod({ lastSentAt: '2025-01-01T00:00:00Z' }, now).from,
    '2026-05-03T10:00:00.000Z',
  )
})

const conversations = [
  {
    id: 7,
    createdAt: '2026-10-30T09:00:00Z',
    state: 'handed-off',
    requestNumber: 'R-12',
    messages: [
      {
        role: 'user',
        content: 'Сколько стоит AutoCAD? мой телефон +7 701 123 45 67',
        at: '2026-10-30T09:00:00Z',
      },
      {
        role: 'assistant',
        content: 'Стоимость уточнит менеджер. Напишите на a@b.kz',
        at: '2026-10-30T09:00:05Z',
      },
    ],
  },
]
const rawSearches = [
  {
    createdAt: '2026-10-30T08:00:00Z',
    query: 'автокад',
    found: 3,
    source: 'suggest',
    click: '/products/autocad',
  },
  { createdAt: '2026-10-30T08:05:00Z', query: 'ыыы', found: 0, source: 'page', click: null },
]

function input() {
  return {
    from: '2026-06-30T10:00:00.000Z',
    to: '2026-10-30T10:00:00.000Z',
    searches: summarizeSearches(rawSearches),
    kaddi: summarizeConversations(conversations, []),
    rawSearches,
    conversations,
    searchesCut: false,
    conversationsCut: false,
  }
}

test('переписка в архиве: роли словами, телефоны и почта скрыты', () => {
  const text = dialogText(conversations[0].messages)
  assert.match(text, /^Клиент: Сколько стоит AutoCAD\? мой телефон \*\*\*/)
  assert.match(text, /Кадди: Стоимость уточнит менеджер\. Напишите на \*\*\*/)
  assert.doesNotMatch(text, /701|a@b\.kz/)
})

test('файлы архива: «что внутри», сводка, таблицы страницы, все запросы и разговоры', () => {
  const files = archiveFiles(input())
  const names = files.map((f) => f.name)
  assert.equal(names[0], '00-chto-vnutri.txt')
  assert.equal(names[1], '01-svodka.csv')
  assert.ok(names.includes('02-zaprosy-poiska.csv'))
  assert.ok(names.some((n) => n.endsWith('-vse-zaprosy-poiska.csv')))
  assert.ok(names.some((n) => n.endsWith('-razgovory-kaddi.csv')))
  for (const name of names) assert.match(name, /^[\x20-\x7e]+$/, `имя латиницей: ${name}`)
  const all = files.map((f) => f.data).join('\n')
  assert.doesNotMatch(all, /701 123|a@b\.kz/, 'контактов клиентов в архиве нет')
  const dialogs = files.find((f) => f.name.endsWith('-razgovory-kaddi.csv'))?.data ?? ''
  assert.match(dialogs, /"R-12"/)
  assert.match(dialogs, /"да"/)
  const raw = files.find((f) => f.name.endsWith('-vse-zaprosy-poiska.csv'))?.data ?? ''
  assert.match(raw, /"30\.10\.2026 13:00";"автокад";3;"Подсказки в шапке";"\/products\/autocad"/)
  const readme = files[0].data
  for (const name of names.slice(1)) assert.ok(readme.includes(name), `в «что внутри» есть ${name}`)
  assert.match(readme, /30\.06\.2026 – 30\.10\.2026/)
  // Архив собирается и читается обратно.
  assert.equal(readZip(createZip(files)).size, files.length)
})

test('письмо: цифры без вопросов клиентов; большой архив — ссылкой', () => {
  const attached = archiveMail({
    input: input(),
    siteUrl: 'https://cad-kz.vercel.app',
    attached: true,
    bytes: 20_000,
    next: new Date('2027-02-28T10:00:00Z'),
  })
  assert.equal(attached.subject, 'CAD.kz: архив аналитики за 30.06.2026 – 30.10.2026')
  assert.match(attached.text, /Поисков: 2/)
  assert.match(attached.text, /Архив во вложении \(20 КБ\)/)
  assert.match(attached.text, /Следующий архив придёт примерно 28\.02\.2027/)
  assert.doesNotMatch(attached.text, /AutoCAD|автокад/, 'вопросов и запросов в тексте письма нет')
  const linked = archiveMail({
    input: input(),
    siteUrl: 'https://cad-kz.vercel.app',
    attached: false,
    bytes: 9_000_000,
    next: null,
  })
  assert.match(linked.text, /не помещается в письмо/)
  assert.match(linked.text, /https:\/\/cad-kz\.vercel\.app\/api\/admin\/analytics\/archive\?from=/)
  assert.equal(archiveName(input().from, input().to), 'analitika-cadkz-2026-06-30--2026-10-30.zip')
})
