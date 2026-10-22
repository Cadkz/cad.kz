import assert from 'node:assert/strict'
import test from 'node:test'
import { avsOfferVariants } from '../src/domain/ownerCatalogSeed.mjs'

test('АВС: новая лицензия сохраняет ключ и базу, обновление — без ключа', () => {
  const opts = { renewal: false, base: true }
  assert.deepEqual(avsOfferVariants(['Ключ Guardant', 'Без базы'], 'АВС-4 HASP РСНБ нет', opts), [
    'Новая лицензия',
    'Ключ Guardant',
    'Без базы',
  ])
  // Повторный запуск не задваивает значение.
  assert.deepEqual(avsOfferVariants(['Новая лицензия', 'Ключ Guardant'], '', opts), [
    'Новая лицензия',
    'Ключ Guardant',
  ])
  // Обновление, уже перенесённое в программу, при повторном запуске не становится лицензией.
  assert.deepEqual(avsOfferVariants(['Обновление', 'Без базы'], 'АВС без рснб', opts), [
    'Обновление',
    'Без базы',
  ])
  const renewal = { renewal: true, base: true }
  assert.deepEqual(avsOfferVariants([], 'АВС Первое рабочее место без рснб', renewal), [
    'Обновление',
    'Без базы',
  ])
  assert.deepEqual(avsOfferVariants([], 'АВС Первое рабочее место с рснб', renewal), [
    'Обновление',
    'С базой РСНБ',
  ])
  assert.deepEqual(avsOfferVariants([], 'ПИР Первое рабочее место', { ...renewal, base: false }), [
    'Обновление',
  ])
})
