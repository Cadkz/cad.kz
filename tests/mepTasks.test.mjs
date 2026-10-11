import assert from 'node:assert/strict'
import test from 'node:test'
import { mepTasksFor } from '../src/domain/mepTasks.mjs'

test('задачи инженерных сетей по словам в тексте, без повторов и не больше пяти', () => {
  assert.deepEqual(mepTasksFor('Model Studio CS ОиВ: отопление и вентиляция', []), [
    'Вентиляция и кондиционирование',
    'Отопление',
  ])
  assert.deepEqual(mepTasksFor('Расчёт вентиляции', ['Вентиляция и кондиционирование']), [])
  assert.deepEqual(mepTasksFor('вентиляция, отопление', ['a', 'b', 'c', 'd']), [
    'Вентиляция и кондиционирование',
  ])
  assert.deepEqual(mepTasksFor('Конструкции из металла', []), [])
})
