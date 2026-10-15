import assert from 'node:assert/strict'
import test from 'node:test'
import { htmlToMarkup } from '../src/domain/bitrixText.mjs'
import { restoreProductTables } from '../src/domain/productTables.mjs'
import { parseBody } from '../src/lib/richText.ts'

// Как на старой странице AutoCAD: сравнение с AutoCAD LT, ячейки с абзацами и значками.
const PAGE = `<html><body><div class="menu"><table><tr><td><a href="/">Главная</a></td></tr></table></div>
<div class="detail"><p>AutoCAD — САПР для черчения.</p>
<table><tr><td><p>Продукты</p></td><td><img src="/i/acad.png"><p>AutoCAD</p></td><td><img src="/i/lt.png"><p>AutoCAD LT</p></td></tr>
<tr><td><p>Основные возможности</p></td><td><ul><li>2D-черчение и подготовка документации</li><li>3D-моделирование и совместная работа</li></ul></td><td><ul><li>2D-черчение и подготовка документации</li></ul></td></tr>
<tr><td><p>Командная строка</p></td><td><p>&#10004;</p></td><td><p>&#10004;</p></td></tr>
<tr><td><p>Динамические блоки</p></td><td><p>&#10004;</p></td><td><p>&#10004;</p></td></tr></table>
<p>Купить AutoCAD можно у нас.</p></div></body></html>`

// Так описание лежит после первого переноса: таблица столбиком.
const FLAT = [
  'AutoCAD — САПР для черчения.',
  'Продукты',
  'AutoCAD',
  'AutoCAD LT',
  'Основные возможности',
  '- 2D-черчение и подготовка документации\n- 3D-моделирование и совместная работа\n- 2D-черчение и подготовка документации',
  'Командная строка',
  '✓',
  '✓',
  'Динамические блоки',
  '✓',
  '✓',
  'Купить AutoCAD можно у нас.',
].join('\n\n')

const TABLE = [
  '| Продукты | AutoCAD | AutoCAD LT |',
  '| Основные возможности | 2D-черчение и подготовка документации; 3D-моделирование и совместная работа | 2D-черчение и подготовка документации |',
  '| Командная строка | ✔ | ✔ |',
  '| Динамические блоки | ✔ | ✔ |',
].join('\n')

test('перенос из Битрикса: таблица сравнения — таблицей, а не ячейкой в строку', () => {
  const markup = htmlToMarkup(PAGE)
  assert.ok(markup.includes(TABLE))
  const table = parseBody(markup).find((block) => block.type === 'table')
  assert.ok(table && table.type === 'table')
  assert.deepEqual(table.head, [['Продукты', 'AutoCAD', 'AutoCAD LT']])
  assert.equal(table.rows.length, 3)
})

test('уже перенесённое описание: столбик заменяется таблицей, повтор ничего не меняет', () => {
  const first = restoreProductTables(FLAT, PAGE)
  assert.equal(first.replaced, 1)
  assert.equal(
    first.description,
    ['AutoCAD — САПР для черчения.', TABLE, 'Купить AutoCAD можно у нас.'].join('\n\n'),
  )
  assert.deepEqual(restoreProductTables(first.description, PAGE), {
    description: first.description,
    replaced: 0,
  })
})

test('описание правили в админке — не трогаем', () => {
  const edited = FLAT.replace('Командная строка', 'Командная строка и подсказки')
  assert.deepEqual(restoreProductTables(edited, PAGE), { description: edited, replaced: 0 })
})
