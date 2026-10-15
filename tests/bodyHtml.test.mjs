import assert from 'node:assert/strict'
import { test } from 'node:test'
import { htmlToMarkup, markupToHtml } from '../src/domain/bodyHtml.mjs'
import { freeSlug, SLUG_MAX, slugFromTitle } from '../src/domain/slug.mjs'
import { videoEmbed } from '../src/domain/video.mjs'

const MARKUP = `Вступление со [ссылкой](https://autodesk.com) и точкой.

## Раздел

### Подзаголовок

- первый
- второй [пункт](/catalog)

1. Шаг один
2. Шаг два

> Важно знать

![Схема](/api/media/file/a.png)

![Вебинар](https://youtu.be/dQw4w9WgXcQ)

| Модель | Память | Цена |
| --- | --- | --- |
| T400 | 2 GB | [100](/x) |
| T600 | | 200 |`

test('редактор: разметка → HTML → та же разметка', () => {
  const html = markupToHtml(MARKUP)
  assert.ok(html.includes('<h2>Раздел</h2>'))
  assert.ok(html.includes('<figure data-video="https://youtu.be/dQw4w9WgXcQ"'))
  assert.ok(html.includes('<thead><tr><th>Модель</th>'))
  assert.equal(htmlToMarkup(html), MARKUP)
})

test('редактор: HTML из Word — без оформления, списки, таблица, мусорные «заголовки»', () => {
  const markup = htmlToMarkup(
    '<html><head><style>p{}</style></head><body><p class=MsoNormal><b>Жирный</b> текст<o:p></o:p></p>' +
      '<p>Абзац два<br>после br<ul><li>один<li>два<ul><li>вложенный</ul></ul>' +
      '<table border=1><tr><td>A<td>B<tr><td>1<td><a href="https://x.kz/a b">2</a></table>' +
      '<h4>## Заголовок 4</h4><p>- не список</p><img src="data:image/png;base64,AAA">' +
      '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="Ролик"></iframe>' +
      '<script>alert(1)</script><a href="javascript:alert(1)">клик</a></body></html>',
  )
  assert.equal(
    markup,
    'Жирный текст\n\nАбзац два\n\nпосле br\n\n- один\n- два\n- вложенный\n\n| A | B |\n' +
      '| 1 | [2](https://x.kz/a%20b) |\n\n### Заголовок 4\n\nне список\n\n' +
      '![Ролик](https://www.youtube.com/embed/dQw4w9WgXcQ)\n\nклик',
  )
})

test('редактор: HTML экранируется, опасные ссылки не проходят', () => {
  const html = markupToHtml('Текст <b>не тег</b> и [ссылка](javascript:alert(1))')
  assert.ok(html.includes('&lt;b&gt;не тег&lt;/b&gt;'))
  assert.ok(!html.includes('javascript'))
})

test('видео: YouTube, Rutube, VK, Vimeo; чужой сайт — нет', () => {
  assert.equal(
    videoEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10')?.embed,
    'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
  )
  assert.equal(
    videoEmbed('https://youtu.be/dQw4w9WgXcQ')?.watch,
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  )
  assert.equal(
    videoEmbed('https://rutube.ru/video/0123456789abcdef0123456789abcdef/')?.embed,
    'https://rutube.ru/play/embed/0123456789abcdef0123456789abcdef',
  )
  assert.equal(
    videoEmbed('https://vkvideo.ru/video-12345_456239017')?.embed,
    'https://vk.com/video_ext.php?oid=-12345&id=456239017',
  )
  assert.equal(
    videoEmbed('https://vk.com/video_ext.php?oid=-1&id=2&hash=abc123&hd=2')?.embed,
    'https://vk.com/video_ext.php?oid=-1&id=2&hash=abc123',
  )
  assert.equal(
    videoEmbed('https://vimeo.com/76979871')?.embed,
    'https://player.vimeo.com/video/76979871',
  )
  assert.equal(videoEmbed('https://example.com/video.mp4'), null)
  assert.equal(videoEmbed('javascript:alert(1)'), null)
})

test('адрес из названия: транслит, длина, свободный', async () => {
  assert.equal(
    slugFromTitle('Запись вебинара по Geomagic Control X'),
    'zapis-vebinara-po-geomagic-control-x',
  )
  assert.equal(slugFromTitle('Вам шашечки или ехать?'), 'vam-shashechki-ili-ekhat')
  assert.equal(slugFromTitle('Щука, цапля и ёж: 2026'), 'shchuka-tsaplya-i-ezh-2026')
  assert.equal(slugFromTitle('Қазақстан үшін'), 'kazakstan-ushin')
  const long = slugFromTitle('Очень длинное название новости '.repeat(10))
  assert.ok(long.length <= SLUG_MAX && !long.endsWith('-'))
  const taken = new Set(['news', 'news-2'])
  assert.equal(await freeSlug('news', async (s) => taken.has(s)), 'news-3')
  assert.equal(await freeSlug('free', async (s) => taken.has(s)), 'free')
})
