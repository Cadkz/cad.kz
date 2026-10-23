import assert from 'node:assert/strict'
import test from 'node:test'
import { mergeSpecs, PROGRAM_TEXTS } from '../src/domain/programTexts.mjs'

const all = (entry) =>
  [entry.summary, entry.description, ...entry.specs.flatMap((s) => [s.name, s.value])].join('\n')

test('тексты 6 программ без оговорок исследователя и номеров версий', () => {
  assert.equal(PROGRAM_TEXTS.length, 6)
  for (const entry of PROGRAM_TEXTS) {
    const text = all(entry)
    assert.doesNotMatch(text, /не подтвержд|подтвердил|подтверждени|не заявл|не является основной/i)
    assert.doesNotMatch(text, /Что нового|20(26|27)/)
    assert.match(entry.description, /^## О программе/)
  }
})

test('Fusion: без строки «Нормы», русского интерфейса нет', () => {
  const fusion = PROGRAM_TEXTS.find((entry) => entry.slugs.includes('fusion'))
  assert.ok(fusion)
  assert.ok(!fusion.specs.some((spec) => spec.name === 'Нормы'))
  assert.match(
    fusion.specs.find((spec) => spec.name === 'Язык интерфейса')?.value ?? '',
    /Русского интерфейса нет/,
  )
})

test('характеристики: новые первыми, прежние о другом остаются', () => {
  const merged = mergeSpecs(
    [
      { name: 'ОС', value: 'Windows 10' },
      { name: 'Тип лицензии', value: 'Подписка на 1 год', id: 'x' },
      { name: 'Язык', value: 'Русский' },
    ],
    [{ name: 'Операционная система', value: 'Windows' }],
  )
  assert.deepEqual(merged, [
    { name: 'Операционная система', value: 'Windows' },
    { name: 'Тип лицензии', value: 'Подписка на 1 год' },
  ])
})
