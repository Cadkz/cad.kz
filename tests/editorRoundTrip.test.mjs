import assert from 'node:assert/strict'
import test from 'node:test'
import { htmlToMarkup as fromBitrix } from '../src/domain/bitrixText.mjs'
import { htmlToMarkup, markupToHtml } from '../src/domain/bodyHtml.mjs'
import { parseBody } from '../src/lib/richText.ts'

/**
 * Описание товара в визуальном редакторе (пакет 2 админки, 23.10.2026): открыть и сохранить —
 * страница товара выглядит так же. Тексты товаров перенесены из Битрикса своим конвертером
 * (src/domain/bitrixText.mjs), поэтому проверяем именно такие.
 */
const roundTrip = (markup) => htmlToMarkup(markupToHtml(markup))
const sameOnSite = (markup) =>
  assert.deepEqual(parseBody(roundTrip(markup)), parseBody(markup), markup)

const BITRIX_HTML = [
  '<p>AutoCAD — <b>система</b> автоматизированного проектирования.</p><p>Второй абзац с <a href="https://cad.kz/x">ссылкой</a>.</p>',
  '<h2>Возможности</h2><ul><li>Первое</li><li>Второе <strong>жирное</strong></li></ul><p>Текст.</p>',
  '<h3>Подзаголовок</h3><ol><li>шаг 1</li><li>шаг 2</li></ol>',
  '<p>Строка<br>с переносом</p><p><img src="/upload/iblock/a.jpg" alt="Окно"></p>',
  '<table><tr><th>Функция</th><th>AutoCAD</th><th>LT</th></tr><tr><td>3D</td><td>Да</td><td>Нет</td></tr></table>',
  '<p>Цена: 1 000 ₸ — &laquo;кавычки&raquo; &nbsp; пробел</p>',
  '<div><span style="color:red">Красный</span> текст в div</div><p>&nbsp;</p>',
  '<blockquote>Важное примечание</blockquote>',
  '<p>Процессор: Intel Core i7<br>Память: 32 ГБ<br>Видеокарта: RTX 4060</p>',
]

test('описания из Битрикса: открыть и сохранить в редакторе — на сайте то же самое', () => {
  for (const html of BITRIX_HTML) sameOnSite(fromBitrix(html))
})

test('перенос строки внутри абзаца остаётся переносом, а не новым абзацем', () => {
  assert.equal(roundTrip('Строка\nс переносом'), 'Строка\nс переносом')
  assert.equal(roundTrip('Процессор: i7\nПамять: 32 ГБ'), 'Процессор: i7\nПамять: 32 ГБ')
  assert.ok(markupToHtml('a\nb').includes('<br data-line="1">'))
})

test('абзац с номером в начале не теряет номер', () => {
  assert.equal(roundTrip('- Пункт\n\n1. Не список\n\n- Ещё'), '- Пункт\n\n1. Не список\n\n- Ещё')
  sameOnSite('1. Один абзац с номером')
})

test('обычный <br> из Word или Shift+Enter — по-прежнему новый абзац', () => {
  assert.equal(htmlToMarkup('<p>Абзац<br>после br</p>'), 'Абзац\n\nпосле br')
})

test('сохранение второй раз ничего не меняет', () => {
  for (const html of BITRIX_HTML) {
    const once = roundTrip(fromBitrix(html))
    assert.equal(roundTrip(once), once)
  }
})
