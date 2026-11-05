import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'
import { pickFacts } from '../src/domain/assistant.mjs'
import { KADDI_FAQ, KADDI_FAQ_2 } from '../src/domain/kaddiFaq.mjs'
import * as fixes from '../src/domain/kaddiKnowledgeCorrections.mjs'

// Снимок до согласованного обновления — проверяем сохранность исключений владельца.
const old = await import('./fixtures/kaddiFaq-before-owner-corrections.mjs')
const previous = [
  ...new Map([...old.KADDI_FAQ, ...old.KADDI_FAQ_2].map((row) => [row.key, row])).values(),
]
const current = [...new Map([...KADDI_FAQ, ...KADDI_FAQ_2].map((row) => [row.key, row])).values()]
const textOf = (rows, key) => rows.find((row) => row.key === key)?.text

test('исключения владельца сохраняются; правки повторно не применяются', () => {
  for (const key of [
    'Справка: nanoCAD — перенос и сетевая лицензия',
    'Справка: прошлые версии Autodesk',
  ]) {
    assert.equal(textOf(current, key), textOf(previous, key))
    assert.equal(fixes.correctKnowledgeText(key, textOf(previous, key)), textOf(previous, key))
  }
  const artec = textOf(current, 'Справка: Artec — компьютер, безопасность, сложные поверхности')
  assert.ok(artec.includes('Artec Studio покупается отдельно от сканера.'))
  for (const entry of previous) {
    const corrected = fixes.correctKnowledgeText(entry.key, entry.text)
    assert.equal(corrected, textOf(current, entry.key), entry.key)
    assert.equal(fixes.correctKnowledgeText(entry.key, corrected), corrected)
  }
})

test('подтверждённые условия аренды и BIM попадают в справку', () => {
  const facts = current.map((row) => ({ product: row.key, text: row.text }))
  const plotter = pickFacts(facts, 'Даете плоттеры в аренду?')
  assert.ok(plotter.some((row) => row.text.includes('не сдаёт плоттеры в аренду')))
  const scanner = pickFacts(facts, 'Нужен 3D-сканер в аренду')
  assert.ok(scanner.some((row) => row.text.includes('только по усмотрению менеджера')))
  assert.match(textOf(current, 'Справка: внедрение BIM'), /без комплексного внедрения/)
  assert.match(textOf(current, 'Справка: внедрение BIM'), /BIM-библиотеки/)
  assert.match(
    textOf(current, 'Справка: SCAD Office — нормы, аренда, выбор с ЛИРА'),
    /на один год для самой полной версии S Promax/,
  )
})

const compiled = ts.transpileModule(
  readFileSync(new URL('../src/lib/kaddiKnowledgeCorrections.ts', import.meta.url), 'utf8'),
  {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  },
).outputText
const exports = {}
new Function('require', 'exports', compiled)((name) => {
  assert.equal(name, '../domain/kaddiKnowledgeCorrections.mjs')
  return fixes
}, exports)

function mockPayload(fail = false) {
  let docs = previous.map((row, i) => ({
    id: i + 1,
    product: row.key,
    text: row.text,
    active: false,
    position: i,
  }))
  docs.push({
    id: 100,
    product: 'Ручная запись',
    text: 'Свой факт, не менять.',
    active: true,
    position: 9,
  })
  let runs = []
  let before
  let rolledBack = false
  const payload = {
    db: {
      beginTransaction: async () => {
        before = structuredClone({ docs, runs })
        return 'tx'
      },
      commitTransaction: async () => {},
      rollbackTransaction: async () => {
        docs = before.docs
        runs = before.runs
        rolledBack = true
      },
    },
    find: async ({ collection }) => ({ docs: collection === 'import-runs' ? runs : docs }),
    findByID: async ({ id }) => docs.find((row) => row.id === id),
    update: async ({ id, data, req }) => {
      assert.equal(req.transactionID, 'tx')
      if (fail) throw new Error('write failed')
      docs = docs.map((row) => (row.id === id ? { ...row, ...data } : row))
    },
    create: async ({ collection, data, req }) => {
      assert.equal(req.transactionID, 'tx')
      const result = { id: 101, ...data }
      if (collection === 'import-runs') runs.push(result)
      else docs.push(result)
      return result
    },
  }
  return { payload, state: () => ({ docs, runs, rolledBack }) }
}

test('обновление сохраняет флаги, порядок, ручные записи и резервный снимок; повторный запуск безопасен', async () => {
  const { payload, state } = mockPayload()
  const report = await exports.setupKaddiKnowledgeCorrections(payload)
  assert.ok(report.length > 0)
  assert.ok(
    state()
      .docs.filter((row) => row.id < 100)
      .every((row) => row.active === false && row.position === row.id - 1),
  )
  assert.equal(state().docs.find((row) => row.id === 100).text, 'Свой факт, не менять.')
  assert.ok(
    state().runs[0].snapshot.changes.every(
      (row) => row.before && row.after && row.before !== row.after,
    ),
  )
  assert.equal(await exports.setupKaddiKnowledgeCorrections(payload), null)
})

test('ошибка записи откатывает изменения и не оставляет отметку успеха', async () => {
  const { payload, state } = mockPayload(true)
  await assert.rejects(exports.setupKaddiKnowledgeCorrections(payload), /write failed/)
  assert.equal(state().rolledBack, true)
  assert.equal(state().runs.length, 0)
  assert.equal(state().docs[0].text, previous[0].text)
})
