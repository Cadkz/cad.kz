import assert from 'node:assert/strict'
import test from 'node:test'
import { offerFor } from '../src/domain/picker.mjs'
import { AVS_SWITCHES, avsVariants } from '../src/domain/pickerSeed2.mjs'

const switches = AVS_SWITCHES.map((sw, i) => ({
  key: `s${i}`,
  title: sw.title,
  options: sw.options,
}))
const offer = (id, configuration, withBase) => ({
  id,
  configuration,
  variants: avsVariants(configuration, withBase),
  price: null,
})
const item = (offers) => ({
  key: 'i',
  productId: 1,
  label: '',
  note: null,
  offers,
  fixedOffers: [],
  preselect: false,
})

test('АВС-4: предложение по защите и базе', () => {
  const avs4 = item([
    offer('1', 'привязка к ключу Guardant, РСНБ да', true),
    offer('2', 'привязка к системному блоку, РСНБ нет', true),
    offer('3', 'привязка к ключу Guardant, РСНБ нет', true),
    offer('4', 'привязка к системному блоку, РСНБ да', true),
  ])
  assert.equal(offerFor(avs4, switches, { s0: 'Ключ Guardant', s1: 'С базой РСНБ' })?.id, '1')
  assert.equal(offerFor(avs4, switches, { s0: 'Привязка к компьютеру', s1: 'Без базы' })?.id, '2')
})

test('модули АВС не пропадают при выборе базы РСНБ', () => {
  const akkord = item([
    offer('5', 'привязка к системному блоку, РСНБ нет', false),
    offer('6', 'привязка к ключу Guardant, РСНБ нет', false),
  ])
  assert.equal(offerFor(akkord, switches, { s0: 'Ключ Guardant', s1: 'С базой РСНБ' })?.id, '6')
})
