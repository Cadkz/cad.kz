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
import * as migration_20261011_153337_promo_ends_at from './20261011_153337_promo_ends_at'
import * as migration_20261011_195336_catalog_packages from './20261011_195336_catalog_packages'
import * as migration_20261011_223417_crm_catalog from './20261011_223417_crm_catalog'
import * as migration_20261012_095832_popular_tiles from './20261012_095832_popular_tiles'
import * as migration_20261013_061127_yuki_price_knowledge from './20261013_061127_yuki_price_knowledge'
import * as migration_20261013_065601_topic_covers from './20261013_065601_topic_covers'
import * as migration_20261015_065936_publication_dates from './20261015_065936_publication_dates'
import * as migration_20261015_081601_admin_history from './20261015_081601_admin_history'
import * as migration_20261015_103001_activity_prices from './20261015_103001_activity_prices'
import * as migration_20261015_110918_quality_presets from './20261015_110918_quality_presets'
import * as migration_20261016_063853_hero_tasks from './20261016_063853_hero_tasks'
import * as migration_20261016_070220_hero_v2 from './20261016_070220_hero_v2'
import * as migration_20261020_120747_open_line from './20261020_120747_open_line'
import * as migration_20261021_131142_catalog_top_logos from './20261021_131142_catalog_top_logos'
import * as migration_20261022_104851_product_redirect_to from './20261022_104851_product_redirect_to'
import * as migration_20261022_125849_equipment_research from './20261022_125849_equipment_research'
import * as migration_20261023_114952_manufacturer_order from './20261023_114952_manufacturer_order'
import * as migration_20261024_000240_product_scans from './20261024_000240_product_scans'

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
  {
    up: migration_20261011_153337_promo_ends_at.up,
    down: migration_20261011_153337_promo_ends_at.down,
    name: '20261011_153337_promo_ends_at',
  },
  {
    up: migration_20261011_195336_catalog_packages.up,
    down: migration_20261011_195336_catalog_packages.down,
    name: '20261011_195336_catalog_packages',
  },
  {
    up: migration_20261011_223417_crm_catalog.up,
    down: migration_20261011_223417_crm_catalog.down,
    name: '20261011_223417_crm_catalog',
  },
  {
    up: migration_20261012_095832_popular_tiles.up,
    down: migration_20261012_095832_popular_tiles.down,
    name: '20261012_095832_popular_tiles',
  },
  {
    up: migration_20261013_061127_yuki_price_knowledge.up,
    down: migration_20261013_061127_yuki_price_knowledge.down,
    name: '20261013_061127_yuki_price_knowledge',
  },
  {
    up: migration_20261013_065601_topic_covers.up,
    down: migration_20261013_065601_topic_covers.down,
    name: '20261013_065601_topic_covers',
  },
  {
    up: migration_20261015_065936_publication_dates.up,
    down: migration_20261015_065936_publication_dates.down,
    name: '20261015_065936_publication_dates',
  },
  {
    up: migration_20261015_081601_admin_history.up,
    down: migration_20261015_081601_admin_history.down,
    name: '20261015_081601_admin_history',
  },
  {
    up: migration_20261015_103001_activity_prices.up,
    down: migration_20261015_103001_activity_prices.down,
    name: '20261015_103001_activity_prices',
  },
  {
    up: migration_20261015_110918_quality_presets.up,
    down: migration_20261015_110918_quality_presets.down,
    name: '20261015_110918_quality_presets',
  },
  {
    up: migration_20261016_063853_hero_tasks.up,
    down: migration_20261016_063853_hero_tasks.down,
    name: '20261016_063853_hero_tasks',
  },
  {
    up: migration_20261016_070220_hero_v2.up,
    down: migration_20261016_070220_hero_v2.down,
    name: '20261016_070220_hero_v2',
  },
  {
    up: migration_20261020_120747_open_line.up,
    down: migration_20261020_120747_open_line.down,
    name: '20261020_120747_open_line',
  },
  {
    up: migration_20261021_131142_catalog_top_logos.up,
    down: migration_20261021_131142_catalog_top_logos.down,
    name: '20261021_131142_catalog_top_logos',
  },
  {
    up: migration_20261022_104851_product_redirect_to.up,
    down: migration_20261022_104851_product_redirect_to.down,
    name: '20261022_104851_product_redirect_to',
  },
  {
    up: migration_20261022_125849_equipment_research.up,
    down: migration_20261022_125849_equipment_research.down,
    name: '20261022_125849_equipment_research',
  },
  {
    up: migration_20261023_114952_manufacturer_order.up,
    down: migration_20261023_114952_manufacturer_order.down,
    name: '20261023_114952_manufacturer_order',
  },
  {
    up: migration_20261024_000240_product_scans.up,
    down: migration_20261024_000240_product_scans.down,
    name: '20261024_000240_product_scans',
  },
]
