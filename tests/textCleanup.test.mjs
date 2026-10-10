import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applyCardEdits,
  cleanCardText,
  cleanTitle,
  dedupeTableRows,
  fixMixedScripts,
  removeShopStamp,
} from '../src/domain/textCleanup.mjs'

test('буквы-двойники: слово приводится к своей азбуке', () => {
  assert.equal(fixMixedScripts('AutoСAD - самое популярное'), 'AutoCAD - самое популярное')
  assert.equal(fixMixedScripts('в течение чaca нa объекте'), 'в течение часа на объекте')
  assert.equal(fixMixedScripts('GEO5 Облако Tочек'), 'GEO5 Облако Точек')
  assert.equal(cleanTitle('SCAD комплект US (SSB + RС+ SS)'), 'SCAD комплект US (SSB + RC+ SS)')
  // Только двойники — по азбуке всего текста.
  assert.equal(
    fixMixedScripts('Проверка по ЕH 1997-1 и Уpoвень'),
    'Проверка по ЕН 1997-1 и Уровень',
  )
  // Склейка настоящих букв обеих азбук не трогается.
  assert.equal(fixMixedScripts('PDMП'), 'PDMП')
  // Обычный текст без изменений.
  const plain = 'Revit — BIM-платформа, 3D-модель и ЛИРА-FEM.'
  assert.equal(fixMixedScripts(plain), plain)
})

test('склеенные слова и пробел после точки', () => {
  assert.equal(
    cleanCardText('- AutoCADArchitecture - элементы\n- AutoCADMEP - сети'),
    '- AutoCAD Architecture - элементы\n- AutoCAD MEP - сети',
  )
  assert.equal(cleanCardText('модули иTechnologiCS'), 'модули и TechnologiCS')
  assert.equal(cleanCardText('файлов.Ниже приведены'), 'файлов. Ниже приведены')
  assert.equal(cleanCardText('сайт CAD.kz и т.е. так'), 'сайт CAD.kz и т.е. так')
})

test('штамп интернет-магазина убирается', () => {
  assert.equal(
    removeShopStamp('Среда для совместной работы. Выгодная цена в интернет-магазине CAD.kz'),
    'Среда для совместной работы.',
  )
  assert.equal(
    cleanCardText(
      'Работа.Выгодная цена в интернет-магазине CAD.kz\n\nПолучите самую выгодную цену при покупке в интернет-магазине CAD.kz.\n\nВ полный AutoCAD входят',
    ),
    'Работа.\n\nВ полный AutoCAD входят',
  )
})

test('повтор строки таблицы убирается, абзацы — нет', () => {
  const text = 'РСУ — ✓ — ✓\nМонтаж — ✓ — ✓\nРСУ — ✓ — ✓\n\nАбзац\n\nАбзац'
  assert.equal(dedupeTableRows(text), 'РСУ — ✓ — ✓\nМонтаж — ✓ — ✓\n\nАбзац\n\nАбзац')
})

test('точечные правки: GEO5, Revit, Artec', () => {
  assert.equal(
    applyCardEdits('Графический адаптер — Поддержка OpenGL 3.3'),
    'Графический адаптер — поддержка OpenGL 4.6 (минимум 3.3)\n\nОперативная память — от 16 ГБ\n\nИнтернет — нужен для работы лицензии',
  )
  assert.equal(
    applyCardEdits('Artec Studio 19, Artec Studio 190'),
    'Artec Studio 20, Artec Studio 190',
  )
  assert.equal(
    applyCardEdits(
      cleanCardText(
        'Система рендеринга MentalRay позволяет добиться фотореалистичной визуализации проектов.',
      ),
    ),
    'Встроенная визуализация позволяет добиться фотореалистичных изображений проектов.',
  )
})
