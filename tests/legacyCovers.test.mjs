import assert from 'node:assert/strict'
import test from 'node:test'
import { listingCovers, listingFor, listingPage } from '../src/domain/legacyCovers.mjs'

test('обложки из списка старого сайта: ссылка и картинка анонса', () => {
  const html = `
    <a href="/articles/scad_office_27-1/">
      <img src="/upload/iblock/ea8/6g2o.png" width="1920" height="1080" alt="SCAD"></a>
    <a href="/articles/scad_office_27-1/">SCAD Office 27.1</a>
    <a href="/about/actions/skidka/"><img class="x" src="/upload/iblock/c4d/mk.png"></a>
    <a href="/catalog/x/"><img src="/upload/a.png"></a>`
  const covers = listingCovers(html)
  assert.equal(covers.size, 2)
  assert.equal(covers.get('/articles/scad_office_27-1/'), '/upload/iblock/ea8/6g2o.png')
  assert.equal(covers.get('/about/actions/skidka/'), '/upload/iblock/c4d/mk.png')
})

test('раздел и страница списка', () => {
  assert.equal(listingFor('/about/news/x/'), '/about/news/')
  assert.equal(listingFor('/catalog/x/'), null)
  assert.equal(listingPage('/articles/', 3), '/articles/?PAGEN_2=3&SIZEN_2=9')
})
