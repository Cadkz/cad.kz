import assert from 'node:assert/strict'
import test from 'node:test'
import { anthropicReply, joinReply, withoutPreamble } from '../src/domain/anthropicChat.mjs'
import { cardsBelow, cleanReply, promptLinks, withoutTitleTail } from '../src/domain/assistant.mjs'
import { checkReply } from '../src/domain/assistantCheck.mjs'
import { KADDI_FAQ, KADDI_FAQ_2 } from '../src/domain/kaddiFaq.mjs'

// Второй прогон «Проверки Кадди» 30.10.2026.

/** @param {object[]} turns */
function fakeFetch(turns) {
  const calls = []
  const fetchImpl = async (_url, init) => {
    calls.push(JSON.parse(init.body))
    const next = turns.shift()
    return { ok: true, status: 200, json: async () => next }
  }
  return { fetchImpl, calls }
}

const base = { apiKey: 'k', model: 'm', system: 'правила', tools: [] }

test('суть, написанная вместе с передачей менеджеру, не теряется', async () => {
  const { fetchImpl } = fakeFetch([
    {
      stop_reason: 'tool_use',
      content: [
        {
          type: 'text',
          text: 'Да, начать можно с аудита: разберём процессы и напишем BIM-стандарт.',
        },
        { type: 'tool_use', id: 't1', name: 'handoffToManager', input: {} },
      ],
    },
    {
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: 'Оставьте имя и телефон в форме ниже.' }],
    },
  ])
  const result = await anthropicReply({
    ...base,
    fetchImpl,
    messages: [{ role: 'user', content: 'Сделаете аудит?' }],
    runTool: async () => ({ ok: true }),
  })
  assert.equal(
    result.text,
    'Да, начать можно с аудита: разберём процессы и напишем BIM-стандарт.\n\nОставьте имя и телефон в форме ниже.',
  )
})

test('служебные фразы перед инструментом и повторы в ответ не попадают', () => {
  assert.equal(withoutPreamble('Проверю прайс. Сейчас посмотрю.'), '')
  assert.equal(
    withoutPreamble('Ищу. GEO5 Сваи продаётся отдельно.'),
    'GEO5 Сваи продаётся отдельно.',
  )
  assert.equal(
    joinReply(['Модуль продаётся отдельно.'], 'Модуль продаётся отдельно. Цена — 255 200 ₸.'),
    'Модуль продаётся отдельно. Цена — 255 200 ₸.',
  )
  assert.equal(joinReply(['Суть ответа.'], 'суть ответа'), 'Суть ответа.')
  assert.equal(joinReply([], 'Готово.'), 'Готово.')
})

test('пустой последний ход после всех кругов инструментов — повтор, а не «не закончила ответ»', async () => {
  const toolTurn = {
    stop_reason: 'tool_use',
    content: [{ type: 'tool_use', id: 't', name: 'searchPriceList', input: {} }],
  }
  const { fetchImpl, calls } = fakeFetch([
    ...Array.from({ length: 6 }, () => toolTurn),
    { stop_reason: 'end_turn', content: [] },
    { stop_reason: 'end_turn', content: [{ type: 'text', text: 'Модули продаются отдельно.' }] },
  ])
  const result = await anthropicReply({
    ...base,
    fetchImpl,
    messages: [{ role: 'user', content: 'GEO5 весь пакет?' }],
    runTool: async () => ({}),
  })
  assert.equal(result.text, 'Модули продаются отдельно.')
  assert.equal(calls.length, 8)
})

test('карточки всегда «ниже», названия строками в конце убираются', () => {
  assert.equal(
    cardsBelow('Карточка GEO5 Сваи выше, модуль выбран.'),
    'Карточка GEO5 Сваи ниже, модуль выбран.',
  )
  assert.equal(cardsBelow('Цена выше рыночной.'), 'Цена выше рыночной.')
  assert.equal(
    withoutTitleTail('Для генплана подойдёт Civil 3D.\n\nCivil 3D'),
    'Для генплана подойдёт Civil 3D.',
  )
  assert.equal(
    withoutTitleTail(
      'Берите Inventor Professional и Fusion for Manufacturing.\n\nInventor Professional\nFusion for Manufacturing',
    ),
    'Берите Inventor Professional и Fusion for Manufacturing.',
  )
  // Последняя строка — не повтор названия: остаётся.
  assert.equal(withoutTitleTail('Выберите срок\n1 год'), 'Выберите срок\n1 год')
  assert.equal(
    cleanReply('Подойдёт Civil 3D. Карточка выше.\n\nCivil 3D'),
    'Подойдёт Civil 3D. Карточка ниже.',
  )
})

test('«он подготовил», «менеджер подготовил» — не о себе с родом', () => {
  const gender = (reply) => checkReply(reply, []).some((flag) => /без рода/.test(flag.text))
  assert.equal(gender('Чтобы он быстро подготовил расчёт на три места.'), false)
  assert.equal(gender('Чтобы менеджер учебного центра подготовил вариант.'), false)
  assert.equal(gender('Я нашёл два варианта.'), true)
  assert.equal(gender('Подготовил расчёт.'), true)
})

test('справка: ключи не повторяются внутри списка, ссылка hh.kz разрешена', () => {
  for (const list of [KADDI_FAQ, KADDI_FAQ_2]) {
    const keys = list.map((entry) => entry.key)
    assert.equal(new Set(keys).size, keys.length)
    for (const key of keys) assert.match(key, /^Справка: /)
  }
  const vacancies = KADDI_FAQ_2.find((entry) => entry.key === 'Справка: вакансии')
  assert.ok(vacancies)
  const allowed = promptLinks(vacancies.text)
  assert.equal(
    cleanReply(
      'Вакансии — https://astana.hh.kz/employer/656089 , откликайтесь там.',
      allowed,
    ).includes('hh.kz'),
    true,
  )
})
