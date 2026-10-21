import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  FOOTER_TEXT_AUDIT,
  footerSettingsPatch,
  footerSocials,
  formatKzPhone,
  OFFICE_FROM_OLD_SITE,
} from '../src/domain/footerContacts.mjs'

test('номер WhatsApp цифрами — в привычном виде', () => {
  assert.equal(formatKzPhone('77015501893'), '+7 (701) 550-18-93')
  assert.equal(formatKzPhone('+7 701 550 18 93'), '+7 (701) 550-18-93')
  assert.equal(formatKzPhone('87172577075'), '+7 (7172) 57-70-75')
  assert.equal(formatKzPhone('12345'), '12345')
})

test('настройка подвала: прежние демоданные — дописать номер, адрес и новое описание', () => {
  const { data, changed } = footerSettingsPatch({
    footerText: FOOTER_TEXT_AUDIT[0],
    phones: [
      { id: 'a', label: '+7 (7172) 578-028', tel: '+77172578028' },
      { id: 'b', label: '+7 (771) 936-50-20', tel: '+77719365020' },
    ],
    address: '',
  })
  assert.equal(data.footerText, FOOTER_TEXT_AUDIT[1])
  assert.equal(data.phones.length, 3)
  assert.deepEqual(data.phones[0], OFFICE_FROM_OLD_SITE.phone)
  assert.equal(data.address, OFFICE_FROM_OLD_SITE.address)
  assert.equal(changed.length, 3)
})

test('настройка подвала: правленное в админке не трогает', () => {
  const { data, changed } = footerSettingsPatch({
    footerText: 'Свой текст',
    phones: [{ label: '57-70-75', tel: '+7 7172 577075' }],
    address: 'Астана, другой адрес',
  })
  assert.deepEqual(data, {})
  assert.deepEqual(changed, [])
})

test('настройка подвала: три номера уже есть — четвёртый не добавляет', () => {
  const phones = ['1', '2', '3'].map((n) => ({ label: n, tel: `+7701000000${n}` }))
  const { data } = footerSettingsPatch({ phones, address: 'есть' })
  assert.equal(data.phones, undefined)
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
