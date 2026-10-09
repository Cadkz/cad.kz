import assert from 'node:assert/strict'
import test from 'node:test'
import {
  decodeEntities,
  divInner,
  excerptFrom,
  htmlToMarkup,
  parseDate,
  parseProductPage,
  parsePublicationPage,
  publicationTarget,
} from '../src/domain/legacyPages.mjs'
import { parseBody, parseInline } from '../src/lib/richText.ts'

// Учебная страница в том же виде, что новости старого cad.kz (компонент news.detail Битрикса).
const page = (
  content,
  { description = 'Описание новости длиной больше сорока знаков для поиска' } = {},
) => `
<html><head><title>Вебинар по SCAD &laquo;Новое&raquo;</title>
<meta name="description" content="${description}">
</head><body><div class="workarea">
<h1 class="bx-title dbg_title">Вебинар по SCAD «Новое»</h1>
<div class="bx-newsdetail test"><div class="bx-newsdetail-block" id="bx_1">
<div class="bx-newsdetail-content">${content}</div>
<div class="bx-newsdetail-date">05.12.2025</div>
<div class="row"><noindex><a href="http://vkontakte.ru/share.php">VK</a></noindex></div>
</div></div></div></body></html>`

test('entities are decoded, unknown ones stay', () => {
  assert.equal(decodeEntities('A&nbsp;&laquo;B&raquo; &#8212; &#x41; &foo;'), 'A «B» — A &foo;')
})

test('inner div respects nesting', () => {
  const html = '<div class="a b-x"><div>1</div><div><div>2</div></div></div><div>3</div>'
  assert.equal(divInner(html, 'b-x'), '<div>1</div><div><div>2</div></div>')
  assert.equal(divInner(html, 'nope'), null)
})

test('old addresses become publication kinds and slugs', () => {
  assert.deepEqual(publicationTarget('/about/news/vebinar-po-scad/'), {
    kind: 'news',
    slug: 'vebinar-po-scad',
  })
  assert.deepEqual(publicationTarget('/about/actions/1466/'), {
    kind: 'promotion',
    slug: 'action-1466',
  })
  assert.deepEqual(publicationTarget('/articles/13_klyuchevykh_sposobnostey-_kotorye/'), {
    kind: 'article',
    slug: '13-klyuchevykh-sposobnostey-kotorye',
  })
  assert.equal(publicationTarget('/about/news/'), null)
  assert.equal(publicationTarget('/about/news/privacy-police.php'), null)
  assert.equal(publicationTarget('/catalog/geo5/geo5/'), null)
})

test('html text becomes paragraphs, headings, lists, links and images', () => {
  const { body, images } = htmlToMarkup(`
    <p>\n\t Первый&nbsp;абзац <b>жирный</b>.</p><p></p>
    <h3>Программа</h3>
    <ul><li>пункт один</li><li>пункт <a href="/catalog/scad/scad_office/">SCAD</a></li></ul>
    <p>Регистрация: <a href="https://pro.cad.kz/reg?x=(1)">ссылка</a> и <a href="javascript:void(0)">кнопка</a></p>
    <p><img src="/files/images/Статьи/ПК для BIM/рис 1.jpg" alt="Схема [1]" width="300"><br></p>
    <img src="http://чужой.рф/upload/foto.png">
    <script>alert(1)</script>
    <p>- пункт через дефис</p>
    <p>## не подзаголовок, а текст<br>со второй строкой</p>
  `)
  assert.deepEqual(body.split('\n\n'), [
    'Первый абзац жирный.',
    '## Программа',
    '- пункт один\n- пункт [SCAD](/catalog/scad/scad_office/)',
    'Регистрация: [ссылка](https://pro.cad.kz/reg?x=%281%29) и кнопка',
    '![Схема 1](https://cad.kz/files/images/%D0%A1%D1%82%D0%B0%D1%82%D1%8C%D0%B8/%D0%9F%D0%9A%20%D0%B4%D0%BB%D1%8F%20BIM/%D1%80%D0%B8%D1%81%201.jpg)',
    '- пункт через дефис',
    'не подзаголовок, а текст',
    'со второй строкой',
  ])
  assert.deepEqual(images, ['/files/images/Статьи/ПК для BIM/рис 1.jpg'])
})

test('converted text is read back by the site markup', () => {
  const { body } = htmlToMarkup(
    '<p>Текст <a href="https://cad.kz/about/">о нас</a></p><p><img src="/upload/a.png" alt="A"></p><ul><li>x</li></ul>',
  )
  const blocks = parseBody(body)
  assert.deepEqual(
    blocks.map((b) => b.type),
    ['paragraph', 'image', 'list'],
  )
  assert.deepEqual(parseInline('Текст [о нас](/about/)'), [
    { text: 'Текст ' },
    { text: 'о нас', href: '/about/' },
  ])
  assert.deepEqual(parseInline('[плохо](javascript:alert(1))'), [{ text: 'плохо' }, { text: ')' }])
})

test('dates from the old site keep their day', () => {
  assert.equal(parseDate('\n 26.07.2017 '), '2017-07-26T07:00:00.000Z')
  assert.equal(parseDate('вчера'), null)
  assert.equal(parseDate('40.13.2020'), null)
})

test('excerpt is the first paragraph, cut by word', () => {
  assert.equal(excerptFrom('![](x)\n\nКороткий [текст](/a).\n\nВторой'), 'Короткий текст.')
  const long = excerptFrom(`${'слово '.repeat(60)}`, 50)
  assert.ok(long.length <= 50 && long.endsWith('…'))
})

test('news page is parsed into a publication', () => {
  const result = parsePublicationPage(
    page('<p>Текст вебинара.</p><img src="/upload/iblock/1.jpg">'),
    '/about/news/vebinar-po-scad/',
  )
  assert.deepEqual(result, {
    kind: 'news',
    slug: 'vebinar-po-scad',
    title: 'Вебинар по SCAD «Новое»',
    publishedAt: '2025-12-05T07:00:00.000Z',
    body: 'Текст вебинара.\n\n![](https://cad.kz/upload/iblock/1.jpg)',
    images: ['/upload/iblock/1.jpg'],
    excerpt: 'Описание новости длиной больше сорока знаков для поиска',
    seo: {
      title: 'Вебинар по SCAD «Новое»',
      description: 'Описание новости длиной больше сорока знаков для поиска',
    },
  })
  assert.equal(parsePublicationPage('<html><h1>Нет текста</h1></html>', '/about/news/x/'), null)
})

test('template descriptions are dropped, html in descriptions is cleaned', () => {
  const short = parsePublicationPage(
    page('<p>Абзац текста.</p>', { description: 'Статьи компании CAD.kz' }),
    '/articles/1/',
  )
  assert.equal(short?.seo.description, '')
  assert.equal(short?.excerpt, 'Абзац текста.')
  const html = parseProductPage(
    '<title>3ds Max купить в Казахстане</title><meta name="description" content="&lt;p style=&quot;x&quot;&gt;Программа для трёхмерной графики и анимации от Autodesk&lt;/p&gt;">',
  )
  assert.deepEqual(html, {
    title: '3ds Max купить в Казахстане',
    description: 'Программа для трёхмерной графики и анимации от Autodesk',
  })
})

test('text pages of the old site are parsed without the repeated title', async () => {
  const { parseInfoPage, pagePath } = await import('../src/domain/legacyPages.mjs')
  const html =
    '<title>Реквизиты компании</title><div class="workarea"><h1>Реквизиты компании</h1><p>БИН 080540017610</p></div>'
  assert.deepEqual(parseInfoPage(html), {
    title: 'Реквизиты компании',
    body: 'БИН 080540017610',
    images: [],
    seo: { title: 'Реквизиты компании', description: '' },
  })
  assert.equal(parseInfoPage('<div>нет</div>'), null)
  assert.equal(pagePath('about'), '/about')
  assert.equal(pagePath('delivery'), '/about/delivery')
})

test('pagination shows the first, last and nearby pages', async () => {
  const { pageWindow } = await import('../src/lib/pagination.ts')
  assert.deepEqual(pageWindow(7, 69), [1, null, 5, 6, 7, 8, 9, null, 69])
  assert.deepEqual(pageWindow(1, 4), [1, 2, 3, 4])
  assert.deepEqual(pageWindow(2, 10), [1, 2, 3, 4, null, 10])
})

test('preview inside a link to the full picture keeps the full picture, no service marks', () => {
  const { body, images } = htmlToMarkup(`
    <h2>Сертификаты компании</h2>
    <a href="/upload/medialibrary/ce7/full.jpg"><img src="/upload/resize_cache/medialibrary/ce7/0_400_1/full.jpg"></a>
    <a href="/about/"><img src="/upload/logo.png" alt="Лого"> подпись</a>
    <h3><img src="/upload/icon.png"> Заголовок</h3>
  `)
  assert.deepEqual(body.split('\n\n'), [
    '## Сертификаты компании',
    '![](https://cad.kz/upload/medialibrary/ce7/full.jpg)',
    '![Лого](https://cad.kz/upload/logo.png)',
    'подпись',
    '![](https://cad.kz/upload/icon.png)',
    'Заголовок',
  ])
  assert.deepEqual(images, [
    '/upload/medialibrary/ce7/full.jpg',
    '/upload/logo.png',
    '/upload/icon.png',
  ])
  assert.ok([...body].every((char) => char >= ' ' || char === '\n'))
})
