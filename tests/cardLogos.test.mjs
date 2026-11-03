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
  assert.equal(logo('AutoCAD Revit LT Suite', 'Autodesk'), a('lt-autocad-revit.svg'))
  assert.equal(logo('LT комплект: AutoCAD + Revit', 'Autodesk'), a('lt-autocad-revit.svg'))
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

test('логотипы владельца 03.11.2026: Chaos, MagiCAD, НТП, АРС-ПС, Base', () => {
  const logo = (title, vendor) => programLogo({ title, vendor })?.url
  assert.equal(logo('V-Ray для 3ds Max', 'Chaos Group'), '/images/brands/chaos/vray-3ds-max.webp')
  assert.equal(
    logo('V-Ray Next для SketchUp', 'Chaos Group'),
    '/images/brands/chaos/vray-sketchup.webp',
  )
  assert.equal(
    logo('Phoenix FD для 3ds Max', 'Chaos Group'),
    '/images/brands/chaos/phoenix-3ds-max.webp',
  )
  assert.equal(logo('Phoenix FD 3.0 для Maya', 'Chaos Group'), undefined)
  assert.equal(
    logo('MagiCAD Вентиляция для Revit', 'MagiCAD'),
    '/images/brands/magicad/magicad-revit.webp',
  )
  assert.equal(
    logo('MagiCAD для AutoCAD', 'MagiCAD'),
    '/images/brands/magicad/magicad-autocad.webp',
  )
  for (const vendor of [
    'Chaos Group',
    'MagiCAD',
    'НТП Трубопровод',
    'АРС-ПС',
    'Base',
    'TDMS Фарватер',
    'АСКОН',
  ]) {
    assert.ok(vendorLogo(vendor), vendor)
  }
})
