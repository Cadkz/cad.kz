import assert from 'node:assert/strict'
import { test } from 'node:test'
import { HINT_CHARS, hintText, valueAtPath } from '../src/domain/russianHint.mjs'

test('значение по пути поля: группа, массив, нет такого', () => {
  const doc = { title: 'AutoCAD', seo: { title: 'Купить' }, tasks: [{ title: 'Чертежи' }] }
  assert.equal(valueAtPath(doc, 'title'), 'AutoCAD')
  assert.equal(valueAtPath(doc, 'seo.title'), 'Купить')
  assert.equal(valueAtPath(doc, 'tasks.0.title'), 'Чертежи')
  assert.equal(valueAtPath(doc, 'tasks.3.title'), undefined)
  assert.equal(valueAtPath(null, 'title'), undefined)
})

test('текст подсказки: без разметки, длинный обрезан', () => {
  assert.equal(
    hintText('## О программе\n\n- Чертежи и [модели](/catalog)\n<p>Да <b>нет</b></p>'),
    'О программе\nЧертежи и модели\nДа нет',
  )
  assert.equal(hintText(null), '')
  const long = hintText('слово '.repeat(200))
  assert.ok(long.length <= HINT_CHARS + 1)
  assert.ok(long.endsWith('…'))
})
