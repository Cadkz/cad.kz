import assert from 'node:assert/strict'
import { test } from 'node:test'
import { licenseType, softwareFacts } from '../src/domain/keyFacts.mjs'

const spec = (name, value) => ({ group: null, name, value })

test('факты программы: ОС, язык интерфейса, тип лицензии — без «Программы» и «Разработчика»', () => {
  const facts = softwareFacts(
    [
      spec('Программа', 'AEC Collection'),
      spec('ОС', 'Windows 11, 64-разрядная'),
      spec('Язык интерфейса', 'Русский'),
      spec('Тип коммерческой лицензии', 'Подписка'),
    ],
    [],
  )
  assert.deepEqual(
    facts.map((f) => `${f.name}: ${f.value}`),
    [
      'Операционная система: Windows 11, 64-разрядная',
      'Язык интерфейса: Русский',
      'Тип лицензии: Подписка',
    ],
  )
})

test('длинная ОС сокращается до названия системы, лицензия — из комплектаций', () => {
  const facts = softwareFacts(
    [spec('ОС', 'Windows 7 x64 (Professional, Ultimate, Home Premium), Windows 10, 11')],
    ['Бессрочная, локальная'],
  )
  assert.deepEqual(facts, [
    { name: 'Операционная система', value: 'Windows' },
    { name: 'Тип лицензии', value: 'Бессрочная' },
  ])
  assert.equal(licenseType(['Подписка на 1 год', 'Бессрочная']), 'Подписка или бессрочная')
  assert.equal(licenseType(['Сетевая']), null)
})
