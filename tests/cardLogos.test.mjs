import assert from 'node:assert/strict'
import test from 'node:test'
import { programLogo, vendorLogo } from '../src/domain/cardLogos.mjs'

const logo = (title, vendor) => programLogo({ title, vendor })?.url ?? null

test('у программ Autodesk и GEO5 — свой значок из набора владельца', () => {
  const a = (name) => `/images/brands/autodesk/${name}`
  assert.equal(logo('AutoCAD', 'Autodesk'), a('autocad.png'))
  assert.equal(logo('AutoCAD - mobile app Premium', 'Autodesk'), a('autocad.png'))
  assert.equal(logo('AutoCAD LT', 'Autodesk'), a('autocad-lt.png'))
  assert.equal(logo('Revit', 'Autodesk'), a('revit.svg'))
  assert.equal(logo('Fusion 360 Team', 'Autodesk'), a('fusion-360.png'))
  assert.equal(logo('Fusion 360 with PowerMill', 'Autodesk'), a('powermill.png'))
  assert.equal(logo('Inventor Professional', 'Autodesk'), a('inventor.svg'))
  assert.equal(logo('AutoCAD Revit LT Suite', 'Autodesk'), a('autocad-revit-lt-suite.png'))
  assert.equal(
    logo('Architecture Engineering & Construction Collection', 'Autodesk'),
    a('aec-collection.svg'),
  )
  assert.equal(logo('Vault PLM', 'Autodesk'), a('vault-plm.png'))
  assert.equal(logo('Autodesk CFD', 'Autodesk'), a('autodesk-cfd-ultimate.png'))
  assert.equal(logo('CFD - cloud', 'Autodesk'), a('autodesk-cfd-ultimate.png'))
  assert.equal(logo('Upchain', 'Autodesk'), null)
  assert.equal(logo('GEO5 Сваи', 'Fine Software'), '/images/brands/geo5-full.webp')
  assert.equal(logo('TRUSS4', 'Fine Software'), null)
  assert.equal(logo('Artec Cloud', 'Artec 3D'), '/images/brands/artec.svg')
  assert.equal(logo('Artec Studio 20', 'Artec 3D'), '/images/brands/artec.svg')
  assert.equal(logo('Artec Leo', 'Artec 3D'), null)
})

test('логотип производителя из кода', () => {
  assert.equal(vendorLogo('SCAD Soft')?.url, '/images/brands/scad.webp')
  assert.equal(vendorLogo('Artec 3D')?.url, '/images/brands/artec.svg')
  assert.equal(vendorLogo('Autodesk'), null)
  assert.equal(vendorLogo(null), null)
})
