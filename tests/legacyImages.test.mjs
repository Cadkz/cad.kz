import assert from 'node:assert/strict'
import test from 'node:test'
import {
  imageUrls,
  isPermanentImageFailure,
  legacyFileKey,
  restoredBody,
  withoutImages,
} from '../src/domain/legacyImages.mjs'

const OLD = 'https://cad.kz/upload/medialibrary/a1/one.png'
const OLD2 = 'https://cad.kz/upload/%D1%84%D0%BE%D1%82%D0%BE.jpg'

test('текст без картинок одинаков, сколько бы картинок ни убрали', () => {
  const full = `Абзац один.\n\n![Схема](${OLD})\n\nАбзац два.\n\n[![](${OLD2})](https://cad.kz/upload/big.jpg)`
  const cut = 'Абзац один.\n\nАбзац два.\n\n[](https://cad.kz/upload/big.jpg)'
  assert.equal(withoutImages(full), withoutImages(cut))
  assert.deepEqual(imageUrls(full), [OLD, OLD2])
})

test('ключ «Медиа» совпадает с ключом скачивания: путь без кодировки', () => {
  assert.equal(legacyFileKey(OLD2), 'legacy:file:/upload/фото.jpg')
  assert.equal(legacyFileKey('не адрес'), null)
})

test('пропавшие картинки возвращаются: скачанные — адресом «Медиа», остальные — старым', () => {
  const fresh = `Текст.\n\n![Схема](${OLD})\n\n![Фото](${OLD2})\n\nКонец.`
  const current = 'Текст.\n\nКонец.'
  const body = restoredBody(current, fresh, (url) =>
    url === OLD ? '/api/media/file/one.png' : null,
  )
  assert.equal(body, `Текст.\n\n![Схема](/api/media/file/one.png)\n\n![Фото](${OLD2})\n\nКонец.`)
})

test('текст правили в админке или картинки на месте — не трогаем', () => {
  const fresh = `Текст.\n\n![Схема](${OLD})`
  assert.equal(
    restoredBody('Текст исправлен.', fresh, () => null),
    null,
  )
  assert.equal(
    restoredBody('Текст.\n\n![Схема](/api/media/file/one.png)', fresh, () => null),
    null,
  )
})

test('из текста убираем только картинку, которой нет на старом сайте', () => {
  assert.equal(isPermanentImageFailure(new Error('ответ 404')), true)
  assert.equal(
    isPermanentImageFailure(new Error('формат image/bmp не принимается в «Медиа»')),
    true,
  )
  assert.equal(isPermanentImageFailure(new Error('ответ 503')), false)
  assert.equal(
    isPermanentImageFailure(new Error('The following field is invalid: legacyKey')),
    false,
  )
  const timeout = new Error('timeout')
  timeout.name = 'TimeoutError'
  assert.equal(isPermanentImageFailure(timeout), false)
})
