import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  EXTRA_PHONE,
  FOOTER_TEXT,
  FOOTER_TEXT_OLD,
  footerSettingsPatch,
  footerSocials,
  LINKEDIN_URL,
  OFFICE,
} from '../src/domain/footerContacts.mjs'
import { parseHours } from '../src/domain/structuredData.mjs'

const two = [
  { id: 'a', label: '+7 (7172) 578-028', tel: '+77172578028' },
  { id: 'b', label: '+7 (771) 936-50-20', tel: '+77719365020' },
]

test('настройка подвала: прежние демоданные — адрес, часы, LinkedIn и новое описание', () => {
  const { data, changed } = footerSettingsPatch({
    footerText: FOOTER_TEXT_OLD[0],
    phones: two,
    address: '',
    socials: [{ network: 'instagram', url: 'https://www.instagram.com/cad.kz_inst' }],
  })
  assert.equal(data.footerText, FOOTER_TEXT)
  assert.equal(data.phones, undefined)
  assert.equal(data.address, OFFICE.address)
  assert.equal(data.hours, OFFICE.hours)
  assert.deepEqual(data.socials.at(-1), { network: 'linkedin', url: LINKEDIN_URL })
  assert.equal(changed.length, 4)
})

test('настройка подвала: после первой версии убирает дописанный номер и партнёров', () => {
  const { data } = footerSettingsPatch({
    footerText: FOOTER_TEXT_OLD[1],
    phones: [{ id: 'x', ...EXTRA_PHONE }, ...two],
    address: OFFICE.address,
    hours: 'Пн–Сб 10:00–19:00',
    socials: [{ network: 'linkedin', url: 'https://linkedin.com/x' }],
  })
  assert.equal(data.footerText, FOOTER_TEXT)
  assert.deepEqual(
    data.phones.map((p) => p.tel),
    two.map((p) => p.tel),
  )
  assert.equal(data.hours, undefined)
  assert.equal(data.socials, undefined)
})

test('настройка подвала: правленное в админке не трогает', () => {
  const { data, changed } = footerSettingsPatch({
    footerText: 'Свой текст',
    phones: [{ label: '57-70-75', tel: '+77172577075' }],
    address: 'Астана, другой адрес',
    hours: 'Пн–Пт 9:00–18:00',
    socials: [{ network: 'linkedin', url: LINKEDIN_URL }],
  })
  assert.deepEqual(data, {})
  assert.deepEqual(changed, [])
})

test('часы работы понятны разметке для поисковиков', () => {
  assert.ok(parseHours(OFFICE.hours))
})

test('Telegram из соцсетей не повторяет кнопку «Написать в Telegram»', () => {
  const socials = [
    { network: 'instagram', url: 'https://www.instagram.com/cad.kz_inst' },
    { network: 'telegram', url: 'https://t.me/cadkz/' },
  ]
  assert.deepEqual(
    footerSocials(socials, 'https://t.me/cadkz').map((s) => s.network),
    ['instagram'],
  )
  assert.equal(footerSocials(socials, null).length, 2)
})
