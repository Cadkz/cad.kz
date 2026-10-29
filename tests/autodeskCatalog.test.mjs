import assert from 'node:assert/strict'
import test from 'node:test'
import {
  AUTODESK_KEEP,
  AUTODESK_NEW,
  CONTENTS_HEADING,
  hideAutodesk,
  withContents,
} from '../src/domain/autodeskCatalogSeed.mjs'

test('Autodesk: остаются коллекции и их программы, остальное ПО скрывается', () => {
  for (const slug of ['autocad', 'autodesk-revit', 'media_entertainment_collection_ic'])
    assert.equal(hideAutodesk({ slug, kind: 'software' }), false)
  for (const slug of ['maya', 'fusion_360_team', 'fusion_360_manage', 'bim_360_docs'])
    assert.equal(hideAutodesk({ slug, kind: 'software' }), true)
  // Новые товары и курсы не скрываются.
  assert.equal(hideAutodesk({ slug: 'revit_lt', kind: 'software' }), false)
  assert.equal(hideAutodesk({ slug: 'kurs_revit', kind: 'course' }), false)
  // Образцы новых товаров остаются на сайте.
  for (const seed of AUTODESK_NEW) assert.ok(AUTODESK_KEEP.includes(seed.copyFrom))
})

test('Состав коллекции: раздел заменяется, остальной текст сохраняется', () => {
  const old = `Вступление.\n\n${CONTENTS_HEADING}\n\n- Старое\n- Ещё\n\n## Лицензия\n\nНа год.`
  assert.equal(
    withContents(old, ['- Revit']),
    `Вступление.\n\n${CONTENTS_HEADING}\n\n- Revit\n\n## Лицензия\n\nНа год.`,
  )
  assert.equal(withContents('Текст.', ['- Maya']), `Текст.\n\n${CONTENTS_HEADING}\n\n- Maya`)
  assert.equal(withContents(null, ['- Maya']), `${CONTENTS_HEADING}\n\n- Maya`)
  // Повторный запуск ничего не меняет.
  const once = withContents(old, ['- Revit'])
  assert.equal(withContents(once, ['- Revit']), once)
})
