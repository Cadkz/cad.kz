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
    const restored = fixes.restorePcSpecs(entry.key, corrected)
    assert.equal(restored, textOf(current, entry.key), entry.key)
    assert.equal(
      fixes.restorePcSpecs(entry.key, fixes.correctKnowledgeText(entry.key, restored)),
      restored,
    )
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

test('Кадди снова знает конкретные характеристики ПК', () => {
  const facts = current.map((row) => ({ product: row.key, text: row.text }))
  const revit = pickFacts(facts, 'Какой компьютер нужен для Revit?')
  assert.ok(revit.some((row) => /32 ГБ/.test(row.text) && /64 ГБ/.test(row.text)))
  const artec = pickFacts(facts, 'Какая видеокарта нужна для Artec Leo?')
  assert.ok(artec.some((row) => /RTX 4060/.test(row.text) && /VCSEL/.test(row.text)))
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
    find: async ({ collection, where }) => ({
      docs:
        collection === 'import-runs'
          ? runs.filter((run) => run.idempotencyKey === where.idempotencyKey.equals)
          : docs,
    }),
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
  const pc = await exports.setupKaddiPcSpecs(payload)
  assert.equal(pc.length, 2)
  assert.match(
    state().docs.find((row) => row.product === 'Справка: компьютер для Autodesk').text,
    /64 ГБ/,
  )
  assert.equal(await exports.setupKaddiPcSpecs(payload), null)
})

test('ошибка записи откатывает изменения и не оставляет отметку успеха', async () => {
  const { payload, state } = mockPayload(true)
  await assert.rejects(exports.setupKaddiKnowledgeCorrections(payload), /write failed/)
  assert.equal(state().rolledBack, true)
  assert.equal(state().runs.length, 0)
  assert.equal(state().docs[0].text, previous[0].text)
})
