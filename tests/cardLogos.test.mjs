import assert from 'node:assert/strict'
import test from 'node:test'
import { programLogo, vendorLogo } from '../src/domain/cardLogos.mjs'

const logo = (title, vendor) => programLogo({ title, vendor })?.url ?? null

test('у программ Autodesk и GEO5 — свой логотип, у комплектов — нет', () => {
  assert.equal(logo('AutoCAD', 'Autodesk'), '/images/brands/autocad.webp')
  assert.equal(logo('AutoCAD - mobile app Premium', 'Autodesk'), '/images/brands/autocad.webp')
  assert.equal(logo('Revit', 'Autodesk'), '/images/brands/revit.webp')
  assert.equal(logo('Fusion 360 Team', 'Autodesk'), '/images/brands/fusion.webp')
  assert.equal(logo('GEO5 Сваи', 'Fine Software'), '/images/brands/geo5-full.webp')
  assert.equal(logo('AutoCAD Revit LT Suite', 'Autodesk'), null)
  assert.equal(logo('Architecture Engineering & Construction Collection', 'Autodesk'), null)
  assert.equal(logo('Inventor Professional', 'Autodesk'), null)
  assert.equal(logo('TRUSS4', 'Fine Software'), null)
})

test('логотип производителя из кода', () => {
  assert.equal(vendorLogo('SCAD Soft')?.url, '/images/brands/scad.webp')
  assert.equal(vendorLogo('Artec 3D')?.url, '/images/brands/artec.svg')
  assert.equal(vendorLogo('Autodesk'), null)
  assert.equal(vendorLogo(null), null)
})
