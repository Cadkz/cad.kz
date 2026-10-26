import assert from 'node:assert/strict'
import test from 'node:test'
import { familyTaskHref, groupByTask } from '../src/domain/familyGroups.mjs'

const satellites = [
  'АРБАТ - Экспертиза и подбор арматуры в элементах ж/б конструкций',
  'ВЕСТ (ветер, снег, температура) - Расчет нагрузок',
  'ДЕКОР - Экспертиза элементов деревянных конструкций',
  'ЗАПРОС - Расчет элементов оснований и фундаментов сооружений',
  'КАМИН - Экспертиза элементов каменных и армокаменных конструкций',
  'КОМЕТА - Проектирование соединений металлических конструкций',
  'КРИСТАЛЛ - Экспертиза и расчет элементов стальных конструкций',
  'КРОСС - Расчет коэффициентов упругости оснований (коэффициент Винклера)',
  'МОНОЛИТ - Проектирование монолитных ребристых перекрытий',
  'ОТКОС - Анализ стойкости откосов, склонов',
  'КОНСУЛ - Формирование и расчет произвольных сечений',
]

test('сателлиты SCAD — по задачам, из геотехники основания первыми', () => {
  const groups = groupByTask(satellites, (t) => t, 'geotech')
  assert.ok(groups)
  assert.equal(groups[0]?.key, 'geotech')
  assert.deepEqual(
    groups[0]?.items.map((t) => t.split(' ')[0]),
    ['ЗАПРОС', 'КРОСС', 'ОТКОС'],
  )
  const steel = groups.find((g) => g.key === 'steel')
  assert.deepEqual(
    steel?.items.map((t) => t.split(' ')[0]),
    ['КОМЕТА', 'КРИСТАЛЛ'],
  )
})

test('маленькое семейство не делится', () => {
  assert.equal(
    groupByTask(satellites.slice(0, 4), (t) => t),
    null,
  )
})

test('ссылка на семейство из направления', () => {
  assert.equal(
    familyTaskHref('/families/scad-satellites', 'geotech'),
    '/families/scad-satellites?task=geotech',
  )
  assert.equal(familyTaskHref('/products/x', 'geotech'), '/products/x')
  assert.equal(familyTaskHref('/families/a#b', 'geotech'), '/families/a?task=geotech#b')
})
