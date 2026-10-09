import assert from 'node:assert/strict'
import test from 'node:test'
import { seedTopic } from '../src/domain/topicSeed.mjs'
import { APP_TITLE, seedLine } from '../src/domain/vendorsSeed.mjs'

test('линейки SCAD Soft: база первой, пакеты, модули, сателлиты', () => {
  assert.deepEqual(seedLine('SCAD Soft', 'SCAD Office v. 25.1'), {
    line: 'Программный комплекс',
    order: 1,
  })
  assert.equal(seedLine('SCAD Soft', 'SCAD комплект RC (Ж/Б конструкции)')?.order, 3)
  assert.equal(seedLine('SCAD Soft', 'КРИСТАЛЛ - экспертиза')?.line, 'Сателлиты')
  assert.equal(seedLine('SCAD Soft', 'Что-то новое'), null)
  assert.equal(seedLine('ЛИРА-FEM', 'ЭСПРИ Шпунт')?.line, 'ЭСПРИ')
})

test('приложения и дополнения — в конец', () => {
  assert.ok(APP_TITLE.test('AutoCAD - mobile app Premium'))
  assert.ok(APP_TITLE.test('V-Ray Cloud Credits, Pack 500, коммерческий'))
  assert.ok(!APP_TITLE.test('AutoCAD'))
  assert.ok(!APP_TITLE.test('Fusion 360 - with Cloud Credits'))
})

test('темы публикаций по словам в заголовке', () => {
  assert.equal(seedTopic({ kind: 'news', title: 'Вебинар по Revit 2027' }), 'events')
  assert.equal(seedTopic({ kind: 'news', title: 'Выпущена редакция АВС-KZ 2025.2' }), 'releases')
  assert.equal(seedTopic({ kind: 'news', title: 'Скидка 25% на Autodesk Fusion!' }), 'deals')
  assert.equal(seedTopic({ kind: 'news', title: 'В Астане построят мост' }), 'industry')
  assert.equal(seedTopic({ kind: 'article', title: 'Сетка колонн в Revit' }), 'practice')
})
