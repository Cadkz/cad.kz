import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  alignParts,
  fingerprint,
  isSiteKey,
  LONG_TEXT,
  parseSiteKey,
  planSiteUpdates,
  siteGroups,
  splitLong,
  textEntries,
  valueForLang,
} from '../src/domain/siteTexts.mjs'
import { readTranslationRows } from '../src/domain/translationTable.mjs'

const text = (name, label, localized = true) => ({ type: 'text', name, label, localized })
const area = (name, label, localized = true) => ({ type: 'textarea', name, label, localized })

/** Как «Главная сайта»: группа, массив в группе, общие поля (ссылка, флажок, картинка). */
const homeFields = [
  text('title', 'Заголовок'),
  {
    type: 'group',
    name: 'hero',
    label: 'Первый экран',
    fields: [
      area('lead', 'Подзаголовок'),
      {
        type: 'array',
        name: 'tasks',
        label: 'Кнопки задач',
        fields: [text('label', 'Название'), area('question', 'Вопрос Кадди')],
      },
    ],
  },
  {
    type: 'array',
    name: 'sideCards',
    label: 'Карточки',
    fields: [
      text('title', 'Заголовок'),
      text('linkHref', 'Ссылка', false),
      { type: 'checkbox', name: 'dark', label: 'Тёмная' },
      { type: 'upload', name: 'logo', label: 'Логотип' },
    ],
  },
]

const home = {
  title: { ru: 'Программы и оборудование', kk: 'Бағдарламалар', en: null },
  hero: {
    lead: { ru: 'Подберём лицензию', kk: null, en: null },
    tasks: [
      { id: 'a1', label: { ru: 'BIM', kk: 'BIM', en: 'BIM' }, question: { ru: 'Как начать BIM?' } },
      { id: 'b2', label: { ru: 'Расчёты' }, question: { ru: 'Чем считать?' } },
    ],
  },
  sideCards: [
    { id: 'c3', title: { ru: 'ТЗ', kk: 'ТТ', en: 'Spec' }, linkHref: '/tz', dark: true, logo: 7 },
  ],
}

/** Как публикация: вкладки без имени, SEO-группа. */
const publicationFields = [
  text('title', 'Название'),
  { type: 'select', name: 'kind', label: 'Тип' },
  {
    type: 'tabs',
    tabs: [
      { label: 'Анонс', fields: [area('excerpt', 'Анонс')] },
      { label: 'Текст', fields: [area('body', 'Текст')] },
      {
        label: 'SEO',
        fields: [
          {
            type: 'group',
            name: 'seo',
            label: 'Для поисковиков',
            fields: [text('title', 'Заголовок вкладки'), area('description', 'Описание')],
          },
        ],
      },
    ],
  },
]

const paragraph = (index) => `Абзац ${index}. ${'текст статьи '.repeat(40).trim()}`
const longBody = Array.from({ length: 24 }, (_, index) =>
  index % 6 === 0 ? `## Раздел ${index}` : paragraph(index),
).join('\n\n')

const docs = [
  { key: 'globals:home-page', title: 'Главная сайта', fields: homeFields, doc: home },
  {
    key: 'publications:5',
    title: 'Новость «Релиз»',
    fields: publicationFields,
    doc: {
      id: 5,
      title: { ru: 'Релиз AutoCAD 2027' },
      kind: 'news',
      excerpt: { ru: 'Коротко', kk: 'Қысқа', en: 'Short' },
      body: { ru: longBody },
      seo: { title: { ru: 'Релиз — CAD.kz' }, description: { ru: '' } },
    },
  },
]

test('ключи текстов сайта', () => {
  assert.ok(isSiteKey('globals:home-page:hero.tasks.a1.label'))
  assert.ok(isSiteKey('publications:5:body#3'))
  assert.ok(!isSiteKey('products:5:title'))
  assert.deepEqual(parseSiteKey('publications:5:body#3'), {
    doc: 'publications:5',
    path: 'body',
    part: 3,
  })
  assert.deepEqual(parseSiteKey('globals:site-settings:purchaseTerms.software.x9.text'), {
    doc: 'globals:site-settings',
    path: 'purchaseTerms.software.x9.text',
    part: null,
  })
  const read = readTranslationRows([
    {
      name: 'Переводы',
      rows: [
        ['Ключ (не менять)', 'Что это', 'Русский', 'Қазақша', 'English'],
        ['globals:home-page:title', '', 'Заголовок', 'Тақырып', 'Title'],
        ['pages:3:body#2', '', 'Текст', 'Мәтін', 'Text'],
        ['что-то', '', '', '', ''],
      ],
    },
  ])
  assert.equal(read?.rows.length, 2)
  assert.equal(read?.skipped, 1)
})

test('тексты по настройке полей: группы, массивы, вкладки; общие поля не берутся', () => {
  const entries = textEntries(homeFields, home)
  assert.deepEqual(
    entries.map((entry) => [entry.path, entry.what]),
    [
      ['title', 'Заголовок'],
      ['hero.lead', 'Первый экран · Подзаголовок'],
      ['hero.tasks.a1.label', 'Первый экран · Кнопки задач 1 · Название'],
      ['hero.tasks.a1.question', 'Первый экран · Кнопки задач 1 · Вопрос Кадди'],
      ['hero.tasks.b2.label', 'Первый экран · Кнопки задач 2 · Название'],
      ['hero.tasks.b2.question', 'Первый экран · Кнопки задач 2 · Вопрос Кадди'],
      ['sideCards.c3.title', 'Карточки 1 · Заголовок'],
    ],
  )
  const seo = textEntries(publicationFields, docs[1].doc).map((entry) => entry.what)
  assert.deepEqual(seo, ['Название', 'Анонс', 'Текст', 'SEO title', 'SEO description'])
})

test('длинный текст делится по абзацам и собирается обратно', () => {
  const { lead, parts } = splitLong(longBody)
  assert.equal(lead, '')
  assert.ok(parts.length > 1)
  assert.ok(parts.every((part) => part.text.length <= 3000))
  assert.equal(parts.map((part) => part.text + part.sep).join(''), longBody)
  // Абзац больше части делится по строкам.
  const big = Array.from({ length: 300 }, (_, index) => `- пункт ${index} ${'x'.repeat(20)}`)
  const split = splitLong(big.join('\n'))
  assert.ok(split.parts.length > 1)
  assert.equal(split.parts.map((part) => part.text + part.sep).join(''), big.join('\n'))
})

test('готовый перевод делится на те же части по строкам', () => {
  const { parts } = splitLong(longBody)
  const translated = longBody.replace(/Абзац/g, 'Paragraph').replace(/текст статьи/g, 'text')
  const slices = alignParts(parts, translated)
  assert.equal(slices?.length, parts.length)
  assert.ok(slices?.[0].text.startsWith('## Раздел 0'))
  assert.equal(alignParts(parts, 'одна строка'), null)
})

test('строки таблицы: подписи, части длинного текста, готовые переводы', () => {
  const groups = siteGroups(docs)
  assert.equal(groups.length, 2)
  const [homeRows, newsRows] = groups
  assert.deepEqual(homeRows[0], {
    key: 'globals:home-page:title',
    what: 'Главная сайта · Заголовок',
    ru: 'Программы и оборудование',
    kk: 'Бағдарламалар',
    en: '',
  })
  const parts = newsRows.filter((row) => row.key.startsWith('publications:5:body#'))
  assert.ok(parts.length > 1)
  assert.match(parts[0].what, /часть 1 из \d+/)
  // Пустой русский текст (SEO description) не выгружается.
  assert.ok(!newsRows.some((row) => row.key === 'publications:5:seo.description'))
  assert.ok(longBody.length > LONG_TEXT)
})

test('запись: массив в группе целиком с общими полями, текст по пути, пустое не стирает', () => {
  const docOf = (key) => docs.find((doc) => doc.key === key)
  const { updates, problems, unchanged } = planSiteUpdates(
    [
      { key: 'globals:home-page:hero.tasks.b2.label', kk: 'Есептеу', en: 'Analysis' },
      { key: 'globals:home-page:title', kk: 'Бағдарламалар', en: 'Software' },
      { key: 'globals:home-page:sideCards.c3.title', kk: '', en: 'Specification' },
      { key: 'globals:home-page:hero.tasks.zz.label', kk: 'Жоқ', en: '' },
      { key: 'publications:5:seo.title', kk: '', en: 'x'.repeat(80) },
      { key: 'pages:99:title', kk: 'Бет', en: '' },
    ],
    docOf,
  )
  assert.equal(unchanged, 1)
  assert.deepEqual(
    problems.map((problem) => problem.reason),
    [
      'поле не найдено (строку удалили?)',
      'длиннее 70 знаков',
      'страница или новость не найдена (удалена?)',
    ],
  )
  assert.equal(updates.length, 1)
  const [update] = updates
  assert.equal(update.texts, 4)
  assert.deepEqual(update.data.kk, {
    hero: {
      lead: null,
      tasks: [
        { id: 'a1', label: 'BIM', question: null },
        { id: 'b2', label: 'Есептеу', question: null },
      ],
    },
  })
  assert.equal(update.data.en.title, 'Software')
  assert.deepEqual(update.data.en.sideCards, [
    { id: 'c3', title: 'Specification', linkHref: '/tz', dark: true, logo: 7 },
  ])
})

test('части длинного текста: копятся, пока не готовы все, потом собираются', () => {
  const docOf = (key) => docs.find((doc) => doc.key === key)
  const { parts } = splitLong(longBody)
  const en = (index) => parts[index].text.replace(/Абзац/g, 'Paragraph')
  const first = planSiteUpdates([{ key: 'publications:5:body#1', kk: '', en: en(0) }], docOf)
  assert.equal(first.updates[0].saveParts.length, 1)
  assert.deepEqual(first.updates[0].data.en, {})
  const stored = parts.slice(0, -1).map((part, index) => ({
    key: 'publications:5:body',
    lang: 'en',
    part: index + 1,
    source: fingerprint(part.text),
    text: en(index),
  }))
  // Русский текст части поменяли — старый перевод этой части не подходит.
  stored[1].source = 'другой'
  const store = new Map([['publications:5:body', stored]])
  const waiting = planSiteUpdates(
    [{ key: `publications:5:body#${parts.length}`, kk: '', en: en(parts.length - 1) }],
    docOf,
    store,
  )
  assert.equal(waiting.updates[0].saveParts.length, 1)
  stored[1].source = fingerprint(parts[1].text)
  const done = planSiteUpdates(
    [{ key: `publications:5:body#${parts.length}`, kk: '', en: en(parts.length - 1) }],
    docOf,
    store,
  )
  const [update] = done.updates
  assert.equal(update.data.en.body, longBody.replace(/Абзац/g, 'Paragraph'))
  assert.deepEqual(update.removeParts, [{ key: 'publications:5:body', lang: 'en' }])
  // На строках таблицы сохранённые части видны как переведённые.
  const rows = siteGroups(docs, store)[1].filter((row) => row.key.includes('body#'))
  assert.equal(rows[0].en, en(0))
  // Испорченная разметка части — пропуск.
  const broken = planSiteUpdates(
    [{ key: 'publications:5:body#1', kk: 'без заголовка', en: '' }],
    docOf,
  )
  assert.equal(broken.updates.length, 0)
  assert.equal(broken.problems.length, 1)
})

test('правка части готового перевода меняет только её', () => {
  const translated = longBody.replace(/Абзац/g, 'Paragraph')
  const site = {
    ...docs[1],
    doc: { ...docs[1].doc, body: { ru: longBody, en: translated } },
  }
  const { parts } = splitLong(longBody)
  const fixed = parts[1].text.replace(/Абзац/g, 'Section text')
  const { updates } = planSiteUpdates(
    [{ key: 'publications:5:body#2', kk: '', en: fixed }],
    () => site,
  )
  const body = updates[0].data.en.body
  assert.ok(body.includes('Section text'))
  assert.ok(body.startsWith(translated.slice(0, 50)))
  assert.equal(body.split('\n').length, translated.split('\n').length)
})

test('значение на языке: переводимое — свой язык или null, общее — как есть', () => {
  const field = homeFields[2]
  assert.deepEqual(valueForLang(field, home.sideCards, 'kk'), [
    { id: 'c3', title: 'ТТ', linkHref: '/tz', dark: true, logo: 7 },
  ])
})
