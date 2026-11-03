import assert from 'node:assert/strict'
import test from 'node:test'
import { markupToHtml } from '../src/domain/bodyHtml.mjs'
import { applyTextEdits, nextText, PRODUCT_TEXTS } from '../src/domain/productTextFixes.mjs'
import { fixMixedScripts } from '../src/domain/textCleanup.mjs'

test('новый текст ставится только поверх старого: правку маркетолога не затираем', () => {
  const change = { to: 'Новый', ifHas: 'CAM 360' }
  assert.equal(nextText('Старый текст про CAM 360', change), 'Новый')
  assert.equal(nextText('Маркетолог уже переписал', change), null)
  assert.equal(nextText('Новый', change), null)
  assert.equal(nextText(null, { to: 'Новый', ifEmpty: true }), 'Новый')
  assert.equal(nextText('Есть текст', { to: 'Новый', ifEmpty: true }), null)
})

test('AutoCAD: в описании отраслевые наборы и сравнение с LT, LT-комплект без облачного рендеринга', () => {
  const acad = PRODUCT_TEXTS.find((item) => item.slug === 'autocad')
  for (const name of [
    'Architecture',
    'Electrical',
    'Map 3D',
    'Mechanical',
    'MEP',
    'Plant 3D',
    'Raster Design',
  ])
    assert.ok(acad?.description?.to.includes(`AutoCAD ${name}`), name)
  assert.ok(acad?.description?.to.includes('| Возможность | AutoCAD | AutoCAD LT |'))
  const suite = PRODUCT_TEXTS.find((item) => item.slug === 'autocad_revit_lt_suite')
  assert.ok(!suite?.description?.to.includes('A360'))
  // Таблица сравнения в описании AutoCAD выводится таблицей.
  assert.ok(markupToHtml(acad?.description?.to ?? '').includes('<table>'))
})

test('коды SCAD латиницей, склейки и индекс Еврокода исправлены', () => {
  assert.equal(
    fixMixedScripts('Напряженно-деформированное состояние (SSВ) SPRO'),
    'Напряженно-деформированное состояние (SSB) SPRO',
  )
  assert.equal(fixMixedScripts('SSB + RС+ SS + TS'), 'SSB + RC+ SS + TS')
  assert.equal(
    applyTextEdits('расширение конфигурацииTechnologiCS-PDM'),
    'расширение конфигурации TechnologiCS-PDM',
  )
  assert.equal(applyTextEdits('сетей 2Dи 3D'), 'сетей 2D и 3D')
  assert.equal(applyTextEdits('изгиб (Мc, Rd)'), 'изгиб (Mc,Rd)')
  // Курс Advance Steel: слова из одних двойников решаются по азбуке всего текста (русской).
  assert.equal(
    fixMixedScripts('Уpoк 1. (4 aк.чaca) Программа курса. Bвeдeниe в Advance Steel'),
    'Урок 1. (4 ак.часа) Программа курса. Введение в Advance Steel',
  )
})

test('этап 2: АВС-KZ — документы, модули и требования по лендингу, Fusion — что добавляется', () => {
  const avs = PRODUCT_TEXTS.find((item) => item.slug === 'the_software_package_avs_4')
  for (const part of ['Локальные, объектные и сводные сметы', 'Экспертиза', 'Guardant', 'РСНБ РК'])
    assert.ok(avs?.description?.to.includes(part), part)
  assert.ok(!avs?.description?.to.includes('Сметчик сохраняет ответственность'))
  for (const slug of ['fusion_for_design', 'fusion_for_manufacturing']) {
    const fusion = PRODUCT_TEXTS.find((item) => item.slug === slug)
    assert.ok(fusion?.description?.to.includes('## Что добавляется к Fusion'), slug)
    assert.ok(!fusion?.description?.to.includes('${'), slug)
  }
})
