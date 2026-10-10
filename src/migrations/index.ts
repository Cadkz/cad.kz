import * as migration_20261008_112430_initial from './20261008_112430_initial'
import * as migration_20261008_122508_blob_object_key from './20261008_122508_blob_object_key'
import * as migration_20261009_053715_catalog_sections from './20261009_053715_catalog_sections'
import * as migration_20261009_061254_manufacturer_image from './20261009_061254_manufacturer_image'
import * as migration_20261009_062507_seo_pages_contacts from './20261009_062507_seo_pages_contacts'
import * as migration_20261009_113041_priority from './20261009_113041_priority'
import * as migration_20261009_113901_price_names from './20261009_113901_price_names'
import * as migration_20261009_122905_lines_topics from './20261009_122905_lines_topics'
import * as migration_20261009_200050_picker_families from './20261009_200050_picker_families'
import * as migration_20261009_204932_picker_item_offers from './20261009_204932_picker_item_offers'
import * as migration_20261009_212940_checkout_optional_email from './20261009_212940_checkout_optional_email'
import * as migration_20261009_235733_search_aliases from './20261009_235733_search_aliases'
import * as migration_20261010_182552_family_renew_label from './20261010_182552_family_renew_label'
import * as migration_20261010_203359_home_trust from './20261010_203359_home_trust'
import * as migration_20261010_213658_home_trust_optional from './20261010_213658_home_trust_optional'

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
  {
    up: migration_20261009_200050_picker_families.up,
    down: migration_20261009_200050_picker_families.down,
    name: '20261009_200050_picker_families',
  },
  {
    up: migration_20261009_204932_picker_item_offers.up,
    down: migration_20261009_204932_picker_item_offers.down,
    name: '20261009_204932_picker_item_offers',
  },
  {
    up: migration_20261009_212940_checkout_optional_email.up,
    down: migration_20261009_212940_checkout_optional_email.down,
    name: '20261009_212940_checkout_optional_email',
  },
  {
    up: migration_20261009_235733_search_aliases.up,
    down: migration_20261009_235733_search_aliases.down,
    name: '20261009_235733_search_aliases',
  },
  {
    up: migration_20261010_182552_family_renew_label.up,
    down: migration_20261010_182552_family_renew_label.down,
    name: '20261010_182552_family_renew_label',
  },
  {
    up: migration_20261010_203359_home_trust.up,
    down: migration_20261010_203359_home_trust.down,
    name: '20261010_203359_home_trust',
  },
  {
    up: migration_20261010_213658_home_trust_optional.up,
    down: migration_20261010_213658_home_trust_optional.down,
    name: '20261010_213658_home_trust_optional',
  },
]
