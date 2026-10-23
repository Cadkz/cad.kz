import config from '@payload-config'
import { getPayload } from 'payload'
import texts from '../src/domain/artecTexts.json' with { type: 'json' }
const payload = await getPayload({ config })
const seed = texts.find((t) => t.slug === 'artec_leo')
const { docs } = await payload.find({ collection: 'products', where: { slug: { equals: 'artec-leo' } }, limit: 1, overrideAccess: true })
await payload.update({ collection: 'products', id: docs[0].id, overrideAccess: true, data: { summary: seed.summary, description: seed.overview, properties: seed.specs.map((s) => ({ name: `${s.group} — ${s.name}`, value: s.value })) } })
console.log('ok', docs[0].id, docs[0].title)
await payload.destroy()
