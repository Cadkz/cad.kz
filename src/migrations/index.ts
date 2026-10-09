import * as migration_20261008_112430_initial from './20261008_112430_initial'
import * as migration_20261008_122508_blob_object_key from './20261008_122508_blob_object_key'
import * as migration_20261009_053715_catalog_sections from './20261009_053715_catalog_sections'
import * as migration_20261009_061254_manufacturer_image from './20261009_061254_manufacturer_image'
import * as migration_20261009_062507_seo_pages_contacts from './20261009_062507_seo_pages_contacts'
import * as migration_20261009_113041_priority from './20261009_113041_priority'
import * as migration_20261009_113901_price_names from './20261009_113901_price_names'
import * as migration_20261009_122905_lines_topics from './20261009_122905_lines_topics'

export const migrations = [
  {
    up: migration_20261008_112430_initial.up,
    down: migration_20261008_112430_initial.down,
    name: '20261008_112430_initial',
  },
  {
    up: migration_20261008_122508_blob_object_key.up,
    down: migration_20261008_122508_blob_object_key.down,
    name: '20261008_122508_blob_object_key',
  },
  {
    up: migration_20261009_053715_catalog_sections.up,
    down: migration_20261009_053715_catalog_sections.down,
    name: '20261009_053715_catalog_sections',
  },
  {
    up: migration_20261009_061254_manufacturer_image.up,
    down: migration_20261009_061254_manufacturer_image.down,
    name: '20261009_061254_manufacturer_image',
  },
  {
    up: migration_20261009_062507_seo_pages_contacts.up,
    down: migration_20261009_062507_seo_pages_contacts.down,
    name: '20261009_062507_seo_pages_contacts',
  },
  {
    up: migration_20261009_113041_priority.up,
    down: migration_20261009_113041_priority.down,
    name: '20261009_113041_priority',
  },
  {
    up: migration_20261009_113901_price_names.up,
    down: migration_20261009_113901_price_names.down,
    name: '20261009_113901_price_names',
  },
  {
    up: migration_20261009_122905_lines_topics.up,
    down: migration_20261009_122905_lines_topics.down,
    name: '20261009_122905_lines_topics',
  },
]
