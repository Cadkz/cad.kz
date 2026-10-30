import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseRequisites } from '../src/domain/requisites.mjs'
import {
  contactLines,
  hasSpecSheet,
  requisiteLines,
  specSheetDate,
  specSheetFileName,
  specSheetHref,
  specSheetModel,
} from '../src/domain/specSheet.mjs'

test('PDF характеристик — только у оборудования с характеристиками', () => {
  const spec = { group: null, name: 'Ширина', value: '914 мм' }
  assert.equal(hasSpecSheet({ kind: 'hardware', properties: [spec] }), true)
  assert.equal(hasSpecSheet({ kind: 'hardware', properties: [] }), false)
  assert.equal(hasSpecSheet({ kind: 'software', properties: [spec] }), false)
})

test('адрес, имя файла и дата по Астане', () => {
  assert.equal(specSheetHref('canon-tm-300'), '/products/canon-tm-300/specs.pdf')
  assert.equal(specSheetFileName('Canon_TM-300'), 'cad-kz-canon-tm-300-harakteristiki.pdf')
  assert.equal(specSheetFileName('---'), 'cad-kz-oborudovanie-harakteristiki.pdf')
  // 30.10, 20:30 UTC — по Астане уже 31.10.
  assert.equal(specSheetDate(new Date('2026-10-30T20:30:00Z')), '31.10.2026')
  assert.equal(specSheetDate(new Date('2026-10-30T08:00:00Z')), '30.10.2026')
})

test('контакты и реквизиты для закупки', () => {
  const contacts = contactLines(
    {
      phones: [{ label: '+7 (7172) 578-028', tel: '+77172578028' }, { tel: '+77719365020' }],
      email: 'info@cad.kz',
      address: 'Астана, ул. Пушкина, 6/1',
      hours: null,
    },
    'cad.kz',
  )
  assert.deepEqual(contacts, [
    { label: 'Телефон', value: '+7 (7172) 578-028, +77719365020' },
    { label: 'Почта', value: 'info@cad.kz' },
    { label: 'Адрес', value: 'Астана, ул. Пушкина, 6/1' },
    { label: 'Сайт', value: 'cad.kz' },
  ])
  const parsed = parseRequisites(
    [
      'Товарищество с ограниченной ответственностью "CAD.kz" (КАД.кз),',
      'действующее на основании Устава.',
      'БИН 080540017610',
      'Местонахождение: Астана, ул. Пушкина, 6/1',
      'Дата первичной регистрации: 28 мая 2008 года',
      'ИИК KZ248562203140498999',
      'в АО "Банк ЦентрКредит"',
      'БИК KCJBKZKX',
    ].join('\n'),
  )
  assert.deepEqual(requisiteLines(parsed), [
    { label: 'Компания', value: 'Товарищество с ограниченной ответственностью «CAD.kz» (КАД.кз)' },
    { label: 'БИН', value: '080540017610' },
    { label: 'Местонахождение', value: 'Астана, ул. Пушкина, 6/1' },
    { label: 'ИИК', value: 'KZ248562203140498999' },
    { label: 'Банк', value: 'АО «Банк ЦентрКредит»' },
    { label: 'БИК', value: 'KCJBKZKX' },
  ])
  assert.deepEqual(requisiteLines(null), [])
})

test('содержимое PDF: группы характеристик в порядке страницы', () => {
  const model = specSheetModel(
    {
      title: 'Canon imagePROGRAF TM-300',
      vendor: 'Canon',
      summary: '  Плоттер A0 для чертежей.  ',
      slug: 'canon-tm-300',
      url: 'https://cad.kz/products/canon-tm-300',
      properties: [
        { group: 'Печать', name: 'Разрешение', value: '2400 × 1200 dpi' },
        { group: null, name: 'Ширина рулона', value: '914 мм (36″)' },
        { group: 'Печать', name: 'Цвета', value: '5' },
      ],
    },
    { date: '30.10.2026', contacts: [], requisites: [] },
  )
  assert.equal(model.vendor, 'Производитель: Canon')
  assert.equal(model.summary, 'Плоттер A0 для чертежей.')
  assert.equal(
    model.groups[0]?.rows[0]?.value,
    '914 мм (36")',
    'дюймы — знаком, который есть в шрифте',
  )
  assert.deepEqual(
    model.groups.map((group) => [group.title, group.rows.length]),
    [
      [null, 1],
      ['Печать', 2],
    ],
  )
})
