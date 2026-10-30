import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  looksUnknown,
  normalizeQuery,
  periodKey,
  summarizeConversations,
  summarizeSearches,
  toCsv,
  validateSearchEvent,
} from '../src/domain/searchStats.mjs'

test('запрос: строчными, ё как е, без телефона и почты', () => {
  assert.equal(normalizeQuery('  Автокад   ЁЛКА '), 'автокад елка')
  assert.equal(normalizeQuery('позвоните +7 (701) 123-45-67'), 'позвоните ***')
  assert.equal(normalizeQuery('ivan@mail.kz revit'), '*** revit')
  // Короткие числа (версии, форматы) остаются.
  assert.equal(normalizeQuery('AutoCAD 2026 A0'), 'autocad 2026 a0')
  assert.equal(normalizeQuery(42), '')
})

test('событие поиска: проверка и клик только на свой сайт', () => {
  const ok = validateSearchEvent({ query: 'Revit', found: 3, source: 'suggest', click: '/p#x' })
  assert.deepEqual(ok, {
    ok: true,
    value: { query: 'revit', found: 3, source: 'suggest', click: '/p' },
  })
  assert.equal(validateSearchEvent({ query: 'r', found: 0, source: 'page' }).ok, false)
  assert.equal(validateSearchEvent({ query: 'revit', found: -1, source: 'page' }).ok, false)
  assert.equal(validateSearchEvent({ query: 'revit', found: 1, source: 'x' }).ok, false)
  const external = { query: 'revit', found: 1, source: 'page', click: '//evil.com' }
  assert.equal(validateSearchEvent(external).ok, false)
  const kaddi = validateSearchEvent({ query: 'revit', found: 0, source: 'suggest', click: 'kaddi' })
  assert.equal(kaddi.ok && kaddi.value.click, 'kaddi')
})

test('сводка поиска: частые, пустые, без кликов', () => {
  const summary = summarizeSearches([
    { query: 'revit', found: 4, source: 'suggest', click: '/products/revit' },
    { query: 'revit', found: 4, source: 'page', click: null },
    { query: 'ревит', found: 0, source: 'page' },
    { query: 'плоттер', found: 5, source: 'page' },
    { query: 'плоттер', found: 5, source: 'suggest' },
  ])
  assert.equal(summary.total, 5)
  assert.equal(summary.unique, 3)
  assert.equal(summary.clicks, 1)
  assert.deepEqual(
    summary.top.map((s) => [s.query, s.count]),
    [
      ['плоттер', 2],
      ['revit', 2],
      ['ревит', 1],
    ],
  )
  assert.equal(summary.top[1]?.top, '/products/revit')
  assert.deepEqual(
    summary.empty.map((s) => s.query),
    ['ревит'],
  )
  assert.deepEqual(
    summary.noClick.map((s) => s.query),
    ['плоттер'],
  )
})

test('Кадди не знал: «уточнит специалист», но не цена по запросу', () => {
  assert.equal(looksUnknown('Это уточнит специалист.'), true)
  assert.equal(looksUnknown('Точно это уточнит менеджер.'), true)
  assert.equal(looksUnknown('В описании этого нет, передам вопрос.'), true)
  assert.equal(looksUnknown('Стоимость этого варианта по запросу, её уточнит менеджер.'), false)
})

test('сводка разговоров: вопросы, кнопки, карточки, передачи', () => {
  const summary = summarizeConversations(
    [
      {
        id: 1,
        createdAt: '2026-10-30T10:00:00Z',
        state: 'open',
        messages: [
          { role: 'user', content: 'Продлить лицензию' },
          { role: 'user', content: 'Сколько стоит Revit?' },
          {
            role: 'assistant',
            content: 'Revit — 900 000 ₸',
            cards: [{ title: 'Revit', href: '/products/revit' }],
          },
          { role: 'user', content: 'Работает ли с IFC 4.3' },
          { role: 'assistant', content: 'Это уточнит специалист.' },
        ],
      },
      {
        id: 2,
        createdAt: '2026-10-30T11:00:00Z',
        state: 'handed-off',
        requestNumber: 'З-12',
        messages: [
          { role: 'user', content: 'сколько стоит revit' },
          {
            role: 'assistant',
            content: 'Вот',
            cards: [{ title: 'Revit', href: '/products/revit' }],
          },
        ],
      },
    ],
    ['Продлить лицензию'],
  )
  assert.equal(summary.total, 2)
  assert.deepEqual(summary.buttons, [{ text: 'Продлить лицензию', count: 1 }])
  assert.equal(summary.questions[0]?.count, 2)
  assert.deepEqual(summary.cards, [{ title: 'Revit', href: '/products/revit', count: 2 }])
  assert.deepEqual(
    summary.handedOff.map((h) => [h.id, h.number, h.question]),
    [[2, 'З-12', 'сколько стоит revit']],
  )
  assert.deepEqual(
    summary.unknown.map((u) => [u.id, u.question]),
    [[1, 'Работает ли с IFC 4.3']],
  )
})

test('CSV для Excel: BOM, точка с запятой, защита от формул', () => {
  const csv = toCsv(
    ['Запрос', 'Раз'],
    [
      ['=1+1', 3],
      ['a "b"', null],
    ],
  )
  assert.equal(csv, '﻿"Запрос";"Раз"\r\n"\'=1+1";3\r\n"a ""b""";\r\n')
})

test('период: по умолчанию 30 дней', () => {
  assert.equal(periodKey('7'), '7')
  assert.equal(periodKey('365'), '30')
  assert.equal(periodKey(undefined), '30')
})
