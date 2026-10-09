import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  catalogPath,
  cleanPath,
  isLegacyPath,
  manufacturerName,
  newPagePath,
  parseCatalogPath,
  pathVariants,
  sectionHint,
  staticLegacyTarget,
  storedVariants,
} from '../src/domain/legacyRoutes.mjs'

test('path is decoded and slashes are collapsed', () => {
  assert.equal(cleanPath('/index%281%29.php'), '/index(1).php')
  assert.equal(cleanPath('//catalog//geo5/'), '/catalog/geo5/')
  assert.equal(cleanPath('/bad%E0%A4%A'), '/bad%E0%A4%A')
})

test('variants cover trailing slash and the old domain', () => {
  assert.deepEqual(pathVariants('/catalog/geo5/geo5'), [
    '/catalog/geo5/geo5',
    '/catalog/geo5/geo5/',
  ])
  assert.deepEqual(pathVariants('/'), ['/'])
  assert.ok(storedVariants('/contacts/').includes('https://cad.kz/contacts/'))
})

test('catalog paths split into section and product code', () => {
  assert.deepEqual(parseCatalogPath('/catalog/geo5/mke/'), { section: 'geo5', code: 'mke' })
  assert.deepEqual(parseCatalogPath('/catalog/PK_SCAD/'), { section: 'PK_SCAD', code: null })
  assert.deepEqual(parseCatalogPath('/catalog/'), { section: null, code: null })
  assert.equal(parseCatalogPath('/catalog/a/b/c/d/'), null)
  assert.equal(parseCatalogPath('/products/geo5'), null)
  assert.equal(catalogPath('geo5', 'mke'), '/catalog/geo5/mke/')
})

test('old pages outside the catalog lead to the nearest new page', () => {
  assert.deepEqual(staticLegacyTarget('/about/news/1631/'), { to: '/news' })
  assert.deepEqual(staticLegacyTarget('/about/news/privacy-police.php'), { to: '/news' })
  assert.deepEqual(staticLegacyTarget('/about/actions/scad-vernulsya/'), {
    to: '/news?kind=promotion',
  })
  assert.deepEqual(staticLegacyTarget('/articles/kak_opredelit_versiyu_fayla_dwg/'), {
    to: '/articles',
  })
  assert.deepEqual(staticLegacyTarget('/training/'), { catalog: { group: 'service' } })
  for (const path of [
    '/users/2536.php',
    '/webstat/usage_201702.html',
    '/oferta.php',
    '/index%281%29.php',
    '/404catalog.php',
    '/forum/topic/1/',
  ])
    assert.deepEqual(staticLegacyTarget(path), { to: '/' }, path)
})

test('old text pages lead to the new text pages', () => {
  assert.deepEqual(staticLegacyTarget('/contacts/'), { to: '/contacts' })
  assert.deepEqual(staticLegacyTarget('/about/'), { to: '/about' })
  assert.deepEqual(staticLegacyTarget('/about/howto/'), { to: '/about/howto' })
  assert.deepEqual(staticLegacyTarget('/about/essentials.php'), { to: '/about/requisites' })
  assert.deepEqual(staticLegacyTarget('/about/team/elena_shulyak'), { to: '/about' })
  assert.deepEqual(staticLegacyTarget('/about/vacancies/'), { to: '/about' })
  assert.equal(newPagePath('/about/'), '/about')
  assert.equal(newPagePath('/About/Delivery/'), '/about/delivery')
  assert.equal(newPagePath('/contacts'), '/contacts')
  assert.equal(newPagePath('/about/news/'), null)
  for (const path of ['/about', '/about/howto', '/contacts'])
    assert.equal(isLegacyPath(path), false, path)
})

test('pages of the new site are not treated as old addresses', () => {
  for (const path of ['/', '/news', '/news/', '/articles', '/articles/', '/cart', '/products/geo5'])
    assert.equal(isLegacyPath(path), false, path)
  assert.equal(isLegacyPath('/catalog/geo5/geo5/'), true)
  // Весь каталог: старый /catalog/ ведёт на новую страницу /catalog (её обрабатывает proxy).
  assert.equal(isLegacyPath('/catalog/'), false)
  assert.equal(isLegacyPath('/catalog'), false)
  assert.equal(newPagePath('/catalog/'), '/catalog')
  assert.equal(newPagePath('/Catalog'), '/catalog')
})

test('manufacturer names come from old addresses, numeric IDs are ignored', () => {
  assert.equal(manufacturerName('/about/manufacturer/Fine+Software/'), 'Fine Software')
  assert.equal(manufacturerName('/about/manufacturer/359/'), null)
  assert.equal(manufacturerName('/about/manufacturer/'), null)
})

test('section hints only for known sections', () => {
  assert.deepEqual(sectionHint('hardware'), { group: 'hardware' })
  assert.deepEqual(sectionHint('magicad'), { vendor: 'MagiCAD', group: 'software' })
  assert.deepEqual(sectionHint('constructor'), {})
  assert.deepEqual(sectionHint('toString'), {})
  assert.deepEqual(sectionHint(null), {})
})

test('every address from the old sitemaps goes to the old-address page', () => {
  const paths = readFileSync('scripts/legacy-paths.txt', 'utf8').split('\n').filter(Boolean)
  assert.ok(paths.length > 2000)
  // Главная и список статей — страницы нового сайта, у них слеш в конце просто убирается.
  // Текстовые страницы (/about/, /contacts/) ведёт на новый адрес сам proxy (newPagePath).
  for (const path of paths)
    if (!['/', '/articles/'].includes(path))
      assert.ok(isLegacyPath(path) || newPagePath(path), path)
})

test('the product map matches the sitemaps', () => {
  const map = JSON.parse(readFileSync('src/domain/legacyCatalog.json', 'utf8'))
  assert.ok(Object.keys(map.products).length > 700)
  for (const [code, section] of Object.entries(map.products)) {
    assert.ok(isLegacyPath(catalogPath(section, code)), code)
    assert.equal(code.includes('/'), false, code)
  }
})
