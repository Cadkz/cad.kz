import assert from 'node:assert/strict'
import { test } from 'node:test'
import { headingCase, headingLevels, TOC_LIMIT } from '../src/domain/outline.mjs'

const h = (text, level = 2, guess = false) => ({ heading: true, text, level, guess })
const p = { heading: false }

const toc = async (body, title) => {
  const { parseBody } = await import('../src/lib/richText.ts')
  return parseBody(body, title).flatMap((b) =>
    b.type === 'heading' && b.level === 2 ? [b.text] : [],
  )
}

test('до пяти разделов — все в оглавлении', () => {
  assert.deepEqual(headingLevels([h('Цены'), p, h('Сроки'), p]), [2, null, 2, null])
})

test('больше пяти разделов одного уровня — оглавления нет, все подзаголовки', () => {
  const items = Array.from({ length: TOC_LIMIT + 1 }, (_, i) => [h(`Раздел ${i}`), p]).flat()
  assert.deepEqual(
    headingLevels(items).filter((level) => level !== null),
    Array(TOC_LIMIT + 1).fill(3),
  )
})

test('заголовок-предложение и длинный абзац в заголовке — обычный текст', () => {
  assert.deepEqual(
    headingLevels([h('Revit теперь поддерживает однофазные панели.'), p, h('А'.repeat(91)), p]),
    [0, null, 0, null],
  )
})

test('заголовок, за которым сразу заголовок, — группа; внутри — подзаголовки', () => {
  assert.deepEqual(
    headingLevels([
      h('Введение'),
      p,
      h('Технические характеристики'),
      h('Память'),
      p,
      h('Скорость печати'),
      p,
      h('Комплект поставки'),
      h('Состав'),
      p,
    ]),
    [2, null, 2, 3, null, 3, null, 2, 3, null],
  )
})

test('заголовок-ссылка — текст; группа сразу после группы — подзаголовок', () => {
  assert.deepEqual(headingLevels([h('[Регистрация](https://cad.kz/)'), p]), [0, null])
  assert.deepEqual(
    headingLevels([
      h('Оборудование'),
      h('Видеокарты'),
      h('Quadro P600'),
      p,
      h('Итоги'),
      h('Время'),
      p,
    ]),
    [2, 3, 3, null, 2, 3, null],
  )
})

test('автор разметил «### » — верим разметке', () => {
  assert.deepEqual(headingLevels([h('Раздел'), h('Пункт', 3), p, h('Раздел 2'), p]), [
    2,
    3,
    null,
    2,
    null,
  ])
})

test('угаданный подзаголовок всегда h3', () => {
  assert.deepEqual(headingLevels([h('Оплата', 3, true), p]), [3, null])
})

test('текст: оглавление без двоеточий, без повтора заголовка страницы', async () => {
  assert.deepEqual(
    await toc(
      '## Обзор\n\n## Процессоры:\n\nТекст про процессоры.\n\n## Память:\n\nТекст про память.',
      'Обзор',
    ),
    ['Процессоры', 'Память'],
  )
})

test('текст: строки таблицы со старого сайта не становятся подзаголовками', async () => {
  const { parseBody } = await import('../src/lib/richText.ts')
  const blocks = parseBody(
    'Вступление статьи про станции.\n\nCPU\n\nDDR\n\nSSD\n\nТекст после таблицы, обычный абзац.\n\nCUDA Cores\n\n384\n\nGPU Memory\n\n2 GB GDDR5',
  )
  assert.equal(blocks.filter((b) => b.type === 'heading').length, 0)
})

test('текст: «### » — подзаголовок h3 с якорем', async () => {
  const { parseBody } = await import('../src/lib/richText.ts')
  const [section, sub] = parseBody('## Установка\n\n### Windows\n\nШаги.')
  assert.deepEqual(
    [section?.type === 'heading' && section.level, sub?.type === 'heading' && sub.level],
    [2, 3],
  )
})

test('заголовок капсом — обычное написание, названия латиницей не трогаем', () => {
  assert.equal(headingCase('КЛЮЧЕВЫЕ ОСОБЕННОСТИ'), 'Ключевые особенности')
  assert.equal(headingCase('ВОЗМОЖНОСТИ BIM В GEO5'), 'Возможности BIM в GEO5')
  assert.equal(headingCase('Внедрение BIM'), 'Внедрение BIM')
  assert.equal(headingCase('МАГНУМ'), 'МАГНУМ')
  assert.equal(headingCase('МОНОМАХ-САПР 2016 R3'), 'МОНОМАХ-САПР 2016 R3')
  assert.equal(
    headingCase('ДЕМОНСТРАЦИОННЫЙ РЕЖИМ РАБОТЫ АВС-4'),
    'Демонстрационный режим работы АВС-4',
  )
  assert.equal(headingCase('3. ЛИРА-САПР И ГРУНТ'), '3. ЛИРА-САПР и грунт')
})

test('абзац из одной точки (остаток старого сайта) не выводится', async () => {
  const { parseBody } = await import('../src/lib/richText.ts')
  const blocks = parseBody('.\n\nПроцесс получения лицензии.\n\n…\n\nДальше текст.')
  assert.deepEqual(
    blocks.map((b) => (b.type === 'paragraph' ? b.text : b.type)),
    ['Процесс получения лицензии.', 'Дальше текст.'],
  )
})
