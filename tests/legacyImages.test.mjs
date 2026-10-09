import assert from 'node:assert/strict'
import test from 'node:test'
import {
  imageUrls,
  isPermanentImageFailure,
  legacyFileKey,
  oldFileLinks,
  restoredBody,
  withoutImages,
  withoutRedirects,
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

test('переход через /bitrix/redirect.php заменяется настоящим адресом', () => {
  const body =
    '[Свод правил](/bitrix/redirect.php?event1=SPRK&goto=https%3A//cad.kz/upload/%25D0%25A1%25D0%259F.pdf&af=c6) и [вебинар](/bitrix/redirect.php?goto=https%3A//www.chaosgroup.com/vray%3Futm%3D1&af=1)'
  assert.equal(
    withoutRedirects(body),
    '[Свод правил](https://cad.kz/upload/%D0%A1%D0%9F.pdf) и [вебинар](https://www.chaosgroup.com/vray?utm=1)',
  )
})

test('ссылки на PDF и картинки старого сайта находятся, страницы и чужие сайты — нет', () => {
  const body = [
    '[Протокол](/upload/iblock/0aa/%D0%BF%D1%80%D0%BE%D1%82%D0%BE%D0%BA%D0%BE%D0%BB.pdf)',
    '[Брошюра](https://www.cad.kz/files/images/b.pdf)',
    '[Фото](/upload/big.jpg)',
    '![Картинка](https://cad.kz/upload/small.jpg)',
    '[Новость](/about/news/1/)',
    '[Архив](/upload/a.zip)',
    '[Чужой](https://example.com/upload/x.pdf)',
  ].join('\n\n')
  assert.deepEqual(
    oldFileLinks(body).map((l) => [l.label, l.url]),
    [
      [
        'Протокол',
        'https://cad.kz/upload/iblock/0aa/%D0%BF%D1%80%D0%BE%D1%82%D0%BE%D0%BA%D0%BE%D0%BB.pdf',
      ],
      ['Брошюра', 'https://cad.kz/files/images/b.pdf'],
      ['Фото', 'https://cad.kz/upload/big.jpg'],
    ],
  )
})
