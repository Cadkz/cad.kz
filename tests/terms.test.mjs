import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readSpreadsheet } from '../src/domain/spreadsheet.mjs'
import {
  localizeSpecs,
  needsTerm,
  pickerTexts,
  planTermUpdates,
  termCollector,
  termGroups,
  termTranslator,
} from '../src/domain/terms.mjs'
import {
  nextPart,
  progress,
  readTranslationRows,
  writeTranslationXlsx,
} from '../src/domain/translationTable.mjs'

test('в словарь идут только тексты с русскими буквами', () => {
  assert.equal(needsTerm('Точность'), true)
  assert.equal(needsTerm('600 dpi'), false)
  assert.equal(needsTerm('USB 3.0'), false)
  assert.equal(needsTerm(null), false)
  assert.equal(needsTerm('д'.repeat(1001)), false)
})

test('сборщик: повторы считаются, виды по порядку, уже переведённое пропускается', () => {
  const collector = termCollector((text) => text === 'Подписка')
  collector.add('Бессрочная', 'license', 'AutoCAD')
  collector.add('Точность', 'name', 'Artec Leo')
  collector.add(' Точность ', 'name', 'Artec Eva')
  collector.add('до 0,1 мм', 'value', 'Artec Leo', 'Точность')
  collector.add('Подписка', 'license', 'Revit')
  collector.add('0,1', 'value', 'Artec Leo')
  const list = collector.list()
  assert.deepEqual(
    list.map((item) => [item.text, item.kind, item.count]),
    [
      ['Точность', 'name', 2],
      ['до 0,1 мм', 'value', 1],
      ['Бессрочная', 'license', 1],
    ],
  )
  const groups = termGroups(list, new Map([['Точность', { id: 3, kk: 'Дәлдік', en: '' }]]))
  assert.deepEqual(groups[0], [
    {
      key: 'terms:Точность',
      what: 'Характеристика · Artec Leo и ещё 1',
      ru: 'Точность',
      kk: 'Дәлдік',
      en: '',
    },
  ])
  assert.equal(groups[1][0].what, 'Значение характеристики «Точность» · Artec Leo')
  assert.equal(progress(groups).kk, 1)
  assert.equal(nextPart(groups).length, 3)
})

test('строки словаря проходят через Excel и читаются обратно', async () => {
  const rows = [
    { key: 'terms:Масса: до 1 кг', what: 'Характеристика', ru: 'Масса: до 1 кг', kk: '', en: '' },
  ]
  const sheets = await readSpreadsheet(new Uint8Array(writeTranslationXlsx(rows)))
  const found = readTranslationRows(sheets)
  assert.deepEqual(found?.rows, [{ key: 'terms:Масса: до 1 кг', kk: '', en: '' }])
  assert.equal(found?.skipped, 0)
})

test('загрузка: новое создаётся, известное дополняется, испорченный ключ пропускается', () => {
  const known = new Map([
    ['Масса', { id: 5, kk: 'Салмақ', en: '' }],
    ['1 год', { kk: '', en: '' }],
  ])
  const plan = planTermUpdates(
    [
      { key: 'terms:Масса', kk: 'Салмақ', en: 'Weight' },
      { key: 'terms:1 год', kk: '1 жыл', en: '1 year' },
      { key: 'terms:Масса изделия', kk: 'Бұйым салмағы', en: '' },
      { key: 'products:1:title', kk: 'x', en: 'x' },
    ],
    known,
  )
  assert.deepEqual(plan.updates, [
    { ru: 'Масса', id: 5, data: { en: 'Weight' } },
    { ru: '1 год', data: { kk: '1 жыл', en: '1 year' } },
  ])
  assert.equal(plan.unchanged, 1)
  assert.deepEqual(
    plan.problems.map((problem) => problem.key),
    ['terms:Масса изделия'],
  )
})

test('подмена на странице: точное совпадение, иначе русский', () => {
  const tr = termTranslator(
    new Map([
      ['Точность', 'Accuracy'],
      ['до 0,1 мм', 'up to 0.1 mm'],
      ['1 год', '1 year'],
    ]),
  )
  assert.equal(tr('Точность'), 'Accuracy')
  assert.equal(tr('Точность 3D'), 'Точность 3D')
  assert.deepEqual(
    localizeSpecs([{ group: 'Точность', name: 'Точность', value: 'до 0,1 мм' }], tr),
    [{ group: 'Accuracy', name: 'Accuracy', value: 'up to 0.1 mm' }],
  )
  assert.equal(termTranslator(null)('Масса'), 'Масса')
  const view = {
    switches: [{ key: 's', title: 'Срок', options: [{ value: '1 год', note: null }] }],
    steps: [
      {
        key: 'st',
        title: 'Комплектация',
        hint: null,
        mode: 'one',
        collapsed: false,
        items: [
          {
            key: 'i',
            productId: 1,
            label: 'Точность',
            note: null,
            offers: [],
            fixedOffers: [],
            preselect: false,
          },
        ],
      },
    ],
  }
  assert.deepEqual(pickerTexts(view, tr), { '1 год': '1 year', Точность: 'Accuracy' })
})
