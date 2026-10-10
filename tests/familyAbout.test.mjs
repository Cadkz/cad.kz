import assert from 'node:assert/strict'
import test from 'node:test'
import { aboutEntries } from '../src/domain/familyAbout.mjs'

const passat = 'Программа «ПАССАТ» предназначена для расчета прочности сосудов.'
const member = (id, title, label, description, href = null) => ({
  id,
  title,
  label,
  description,
  href,
})

test('одинаковое описание — один раз, заголовок самый частый', () => {
  const entries = aboutEntries([
    member(1, 'ПАССАТ - базовый', 'ПАССАТ', passat),
    member(2, 'ПАССАТ - Колонны', 'ПАССАТ', passat, '/catalog/x/'),
    member(3, 'ПАССАТ (модули …) + "Штуцер - МКЭ"', 'ПАССАТ (модули …)', `${passat}  `),
    member(4, 'Штуцер - МКЭ', 'Штуцер', 'Расчёт узла врезки методом конечных элементов.'),
    member(5, 'ПАССАТ - Сейсмика', 'ПАССАТ', ''),
  ])
  assert.deepEqual(
    entries.map((entry) => [entry.heading, entry.href]),
    [
      ['ПАССАТ', null],
      ['Штуцер', null],
    ],
  )
})

test('совпавшие заголовки разных описаний — полное название', () => {
  const entries = aboutEntries([
    member(1, 'ПАССАТ - базовый', 'ПАССАТ', 'Описание базового модуля.', '/a'),
    member(2, 'ПАССАТ - Колонны', 'ПАССАТ', 'Описание колонн.'),
  ])
  assert.deepEqual(
    entries.map((entry) => [entry.heading, entry.href]),
    [
      ['ПАССАТ - базовый', '/a'],
      ['ПАССАТ - Колонны', null],
    ],
  )
})
