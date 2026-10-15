import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum__products_v_version_picker_steps_mode" AS ENUM('base', 'one', 'many', 'bundle');
  CREATE TYPE "public"."enum__products_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__products_v_version_priority" AS ENUM('flagship', 'top', 'normal', 'low');
  CREATE TYPE "public"."enum__products_v_version_scenario" AS ENUM('standard', 'corporate', 'equipment', 'renewal', 'service');
  CREATE TYPE "public"."enum__products_v_version_page_view" AS ENUM('standard', 'picker', 'none');
  CREATE TYPE "public"."enum__products_v_version_kind" AS ENUM('software', 'hardware', 'course', 'service');
  CREATE TYPE "public"."enum__offers_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__offers_v_version_currency" AS ENUM('KZT', 'USD', 'EUR', 'RUB');
  CREATE TYPE "public"."enum__sections_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__sections_v_version_menu_group" AS ENUM('software', 'hardware', 'service');
  CREATE TYPE "public"."enum__sections_v_version_icon" AS ENUM('building', 'columns', 'layers', 'route', 'wrench', 'droplet', 'cog', 'image', 'file', 'scan', 'printer', 'monitor', 'graduation', 'compass');
  CREATE TYPE "public"."enum__sections_v_version_tone" AS ENUM('navy', 'blue', 'graphite');
  CREATE TYPE "public"."enum__sections_v_version_scenario" AS ENUM('standard', 'corporate', 'equipment', 'renewal', 'service');
  CREATE TYPE "public"."enum__manufacturers_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__manufacturers_v_version_priority" AS ENUM('flagship', 'top', 'normal', 'low');
  CREATE TYPE "public"."enum__section_rules_v_version_kind" AS ENUM('software', 'hardware', 'course', 'service');
  CREATE TYPE "public"."enum__publications_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__publications_v_version_kind" AS ENUM('article', 'news', 'promotion');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_activity_log_action" AS ENUM('rate', 'vat', 'price-list', 'import', 'crm', 'delete', 'users', 'kaddi');
  CREATE TYPE "public"."enum__site_settings_v_version_socials_network" AS ENUM('instagram', 'facebook', 'youtube', 'telegram', 'linkedin');
  CREATE TABLE "_products_v_version_picker_switches_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"note" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_products_v_version_picker_switches" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_products_v_version_picker_steps_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"product_id" integer,
  	"label" varchar,
  	"note" varchar,
  	"preselect" boolean,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_products_v_version_picker_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"mode" "enum__products_v_version_picker_steps_mode" DEFAULT 'one',
  	"hint" varchar,
  	"collapsed" boolean,
  	"in_catalog" boolean,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_products_v_version_tasks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_products_v_version_properties" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"value" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_products_v_version_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_products_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar NOT NULL,
  	"version_status" "enum__products_v_version_status" DEFAULT 'draft' NOT NULL,
  	"version_slug" varchar NOT NULL,
  	"version_priority" "enum__products_v_version_priority",
  	"version_scenario" "enum__products_v_version_scenario",
  	"version_page_view" "enum__products_v_version_page_view" DEFAULT 'standard' NOT NULL,
  	"version_renew_label" varchar,
  	"version_kind" "enum__products_v_version_kind" NOT NULL,
  	"version_summary" varchar,
  	"version_search_aliases" varchar,
  	"version_description" varchar,
  	"version_manufacturer_id" integer,
  	"version_line_id" integer,
  	"version_line_order" numeric,
  	"version_auto_sections" boolean DEFAULT true,
  	"version_main_section_id" integer,
  	"version_suggest_similar" boolean DEFAULT true,
  	"version_suggest_cross" boolean DEFAULT true,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_legacy_key" varchar,
  	"version_legacy_url" varchar,
  	"version_updated_by_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_products_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_products_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"sections_id" integer,
  	"offers_id" integer,
  	"products_id" integer,
  	"media_id" integer
  );
  
  CREATE TABLE "_offers_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar NOT NULL,
  	"version_status" "enum__offers_v_version_status" DEFAULT 'draft' NOT NULL,
  	"version_product_id" integer,
  	"version_configuration" varchar NOT NULL,
  	"version_license" varchar NOT NULL,
  	"version_amount" varchar NOT NULL,
  	"version_currency" "enum__offers_v_version_currency" NOT NULL,
  	"version_includes_vat" boolean,
  	"version_source_vat" varchar NOT NULL,
  	"version_legacy_key" varchar,
  	"version_legacy_url" varchar,
  	"version_updated_by_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_offers_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_sections_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar NOT NULL,
  	"version_status" "enum__sections_v_version_status" DEFAULT 'draft' NOT NULL,
  	"version_slug" varchar NOT NULL,
  	"version_parent_id" integer,
  	"version_is_direction" boolean,
  	"version_menu_group" "enum__sections_v_version_menu_group" DEFAULT 'software' NOT NULL,
  	"version_summary" varchar,
  	"version_icon" "enum__sections_v_version_icon" DEFAULT 'building',
  	"version_tone" "enum__sections_v_version_tone" DEFAULT 'navy',
  	"version_order" numeric DEFAULT 100,
  	"version_scenario" "enum__sections_v_version_scenario",
  	"version_demo_button" boolean,
  	"version_legacy_key" varchar,
  	"version_legacy_url" varchar,
  	"version_updated_by_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_sections_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"manufacturers_id" integer,
  	"sections_id" integer
  );
  
  CREATE TABLE "_manufacturers_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar NOT NULL,
  	"version_status" "enum__manufacturers_v_version_status" DEFAULT 'draft' NOT NULL,
  	"version_priority" "enum__manufacturers_v_version_priority" DEFAULT 'normal',
  	"version_website" varchar,
  	"version_image_id" integer,
  	"version_legacy_key" varchar,
  	"version_legacy_url" varchar,
  	"version_updated_by_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_section_rules_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar NOT NULL,
  	"version_order" numeric DEFAULT 1000 NOT NULL,
  	"version_manufacturer_id" integer,
  	"version_kind" "enum__section_rules_v_version_kind",
  	"version_words" varchar,
  	"version_main_section_id" integer,
  	"version_retire" boolean,
  	"version_updated_by_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_section_rules_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"sections_id" integer
  );
  
  CREATE TABLE "_publications_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar NOT NULL,
  	"version_status" "enum__publications_v_version_status" DEFAULT 'draft' NOT NULL,
  	"version_slug" varchar NOT NULL,
  	"version_kind" "enum__publications_v_version_kind" NOT NULL,
  	"version_published_at" timestamp(3) with time zone,
  	"version_hide_after" timestamp(3) with time zone,
  	"version_ends_at" timestamp(3) with time zone,
  	"version_theme_id" integer,
  	"version_topic" varchar,
  	"version_excerpt" varchar,
  	"version_cover_id" integer,
  	"version_body" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_legacy_key" varchar,
  	"version_legacy_url" varchar,
  	"version_updated_by_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar NOT NULL,
  	"version_status" "enum__pages_v_version_status" DEFAULT 'draft' NOT NULL,
  	"version_slug" varchar NOT NULL,
  	"version_lead" varchar,
  	"version_body" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_legacy_key" varchar,
  	"version_legacy_url" varchar,
  	"version_updated_by_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_assistant_knowledge_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_text" varchar NOT NULL,
  	"version_product" varchar DEFAULT 'Все',
  	"version_active" boolean DEFAULT true,
  	"version_position" numeric DEFAULT 0,
  	"version_updated_by_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "activity_log" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"action" "enum_activity_log_action" NOT NULL,
  	"summary" varchar NOT NULL,
  	"user_id" integer,
  	"link" varchar,
  	"details" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_pricing_settings_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_vat" varchar DEFAULT '16' NOT NULL,
  	"version_updated_by_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_home_page_v_version_side_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar,
  	"link_label" varchar,
  	"link_href" varchar,
  	"dark" boolean,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_page_v_version_trust_partners" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"vendor" varchar NOT NULL,
  	"logo_id" integer,
  	"status" varchar,
  	"note" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_page_v_version_trust_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_page_v_version_popular_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"product_id" integer,
  	"title" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_page_v_version_bim_stages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_page_v_version_bim_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL,
  	"label" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_page_v_version_process" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_page_v_version_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_eyebrow" varchar,
  	"version_title" varchar NOT NULL,
  	"version_trust_title" varchar,
  	"version_trust_lead" varchar,
  	"version_popular_title" varchar,
  	"version_popular_lead" varchar,
  	"version_renew_title" varchar,
  	"version_renew_text" varchar,
  	"version_bim_eyebrow" varchar,
  	"version_bim_title" varchar,
  	"version_bim_lead" varchar,
  	"version_bim_link_label" varchar,
  	"version_bim_link_href" varchar,
  	"version_cta_title" varchar,
  	"version_cta_text" varchar,
  	"version_cta_link_label" varchar,
  	"version_cta_link_href" varchar,
  	"version_updated_by_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_site_settings_v_version_phones" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"tel" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_settings_v_version_socials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"network" "enum__site_settings_v_version_socials_network" NOT NULL,
  	"url" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_settings_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_whatsapp" varchar,
  	"version_telegram" varchar,
  	"version_email" varchar,
  	"version_address" varchar,
  	"version_hours" varchar,
  	"version_map_url" varchar,
  	"version_footer_text" varchar,
  	"version_updated_by_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "publications" ALTER COLUMN "kind" DROP DEFAULT;
  ALTER TABLE "products" ADD COLUMN "updated_by_id" integer;
  ALTER TABLE "offers" ADD COLUMN "updated_by_id" integer;
  ALTER TABLE "sections" ADD COLUMN "updated_by_id" integer;
  ALTER TABLE "section_rules" ADD COLUMN "updated_by_id" integer;
  ALTER TABLE "manufacturers" ADD COLUMN "updated_by_id" integer;
  ALTER TABLE "publications" ADD COLUMN "updated_by_id" integer;
  ALTER TABLE "pages" ADD COLUMN "updated_by_id" integer;
  ALTER TABLE "assistant_knowledge" ADD COLUMN "updated_by_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "activity_log_id" integer;
  ALTER TABLE "pricing_settings" ADD COLUMN "updated_by_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "updated_by_id" integer;
  ALTER TABLE "home_page" ADD COLUMN "updated_by_id" integer;
  ALTER TABLE "_products_v_version_picker_switches_options" ADD CONSTRAINT "_products_v_version_picker_switches_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v_version_picker_switches"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_picker_switches" ADD CONSTRAINT "_products_v_version_picker_switches_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_picker_steps_items" ADD CONSTRAINT "_products_v_version_picker_steps_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v_version_picker_steps_items" ADD CONSTRAINT "_products_v_version_picker_steps_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v_version_picker_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_picker_steps" ADD CONSTRAINT "_products_v_version_picker_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_tasks" ADD CONSTRAINT "_products_v_version_tasks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_properties" ADD CONSTRAINT "_products_v_version_properties_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_faq" ADD CONSTRAINT "_products_v_version_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_parent_id_products_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_manufacturer_id_manufacturers_id_fk" FOREIGN KEY ("version_manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_line_id_product_lines_id_fk" FOREIGN KEY ("version_line_id") REFERENCES "public"."product_lines"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_main_section_id_sections_id_fk" FOREIGN KEY ("version_main_section_id") REFERENCES "public"."sections"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v_texts" ADD CONSTRAINT "_products_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_sections_fk" FOREIGN KEY ("sections_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_offers_fk" FOREIGN KEY ("offers_id") REFERENCES "public"."offers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_offers_v" ADD CONSTRAINT "_offers_v_parent_id_offers_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."offers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_offers_v" ADD CONSTRAINT "_offers_v_version_product_id_products_id_fk" FOREIGN KEY ("version_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_offers_v" ADD CONSTRAINT "_offers_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_offers_v_texts" ADD CONSTRAINT "_offers_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_offers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sections_v" ADD CONSTRAINT "_sections_v_parent_id_sections_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."sections"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sections_v" ADD CONSTRAINT "_sections_v_version_parent_id_sections_id_fk" FOREIGN KEY ("version_parent_id") REFERENCES "public"."sections"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sections_v" ADD CONSTRAINT "_sections_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sections_v_rels" ADD CONSTRAINT "_sections_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_sections_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sections_v_rels" ADD CONSTRAINT "_sections_v_rels_manufacturers_fk" FOREIGN KEY ("manufacturers_id") REFERENCES "public"."manufacturers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sections_v_rels" ADD CONSTRAINT "_sections_v_rels_sections_fk" FOREIGN KEY ("sections_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_manufacturers_v" ADD CONSTRAINT "_manufacturers_v_parent_id_manufacturers_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."manufacturers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_manufacturers_v" ADD CONSTRAINT "_manufacturers_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_manufacturers_v" ADD CONSTRAINT "_manufacturers_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_section_rules_v" ADD CONSTRAINT "_section_rules_v_parent_id_section_rules_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."section_rules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_section_rules_v" ADD CONSTRAINT "_section_rules_v_version_manufacturer_id_manufacturers_id_fk" FOREIGN KEY ("version_manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_section_rules_v" ADD CONSTRAINT "_section_rules_v_version_main_section_id_sections_id_fk" FOREIGN KEY ("version_main_section_id") REFERENCES "public"."sections"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_section_rules_v" ADD CONSTRAINT "_section_rules_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_section_rules_v_rels" ADD CONSTRAINT "_section_rules_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_section_rules_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_section_rules_v_rels" ADD CONSTRAINT "_section_rules_v_rels_sections_fk" FOREIGN KEY ("sections_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_publications_v" ADD CONSTRAINT "_publications_v_parent_id_publications_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."publications"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_publications_v" ADD CONSTRAINT "_publications_v_version_theme_id_topics_id_fk" FOREIGN KEY ("version_theme_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_publications_v" ADD CONSTRAINT "_publications_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_publications_v" ADD CONSTRAINT "_publications_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_assistant_knowledge_v" ADD CONSTRAINT "_assistant_knowledge_v_parent_id_assistant_knowledge_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."assistant_knowledge"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_assistant_knowledge_v" ADD CONSTRAINT "_assistant_knowledge_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pricing_settings_v" ADD CONSTRAINT "_pricing_settings_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_side_cards" ADD CONSTRAINT "_home_page_v_version_side_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_trust_partners" ADD CONSTRAINT "_home_page_v_version_trust_partners_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_trust_partners" ADD CONSTRAINT "_home_page_v_version_trust_partners_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_trust_links" ADD CONSTRAINT "_home_page_v_version_trust_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_popular_items" ADD CONSTRAINT "_home_page_v_version_popular_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_popular_items" ADD CONSTRAINT "_home_page_v_version_popular_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_bim_stages" ADD CONSTRAINT "_home_page_v_version_bim_stages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_bim_stats" ADD CONSTRAINT "_home_page_v_version_bim_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_process" ADD CONSTRAINT "_home_page_v_version_process_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_faq" ADD CONSTRAINT "_home_page_v_version_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v" ADD CONSTRAINT "_home_page_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_phones" ADD CONSTRAINT "_site_settings_v_version_phones_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_socials" ADD CONSTRAINT "_site_settings_v_version_socials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v" ADD CONSTRAINT "_site_settings_v_version_updated_by_id_users_id_fk" FOREIGN KEY ("version_updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "_products_v_version_picker_switches_options_order_idx" ON "_products_v_version_picker_switches_options" USING btree ("_order");
  CREATE INDEX "_products_v_version_picker_switches_options_parent_id_idx" ON "_products_v_version_picker_switches_options" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_picker_switches_order_idx" ON "_products_v_version_picker_switches" USING btree ("_order");
  CREATE INDEX "_products_v_version_picker_switches_parent_id_idx" ON "_products_v_version_picker_switches" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_picker_steps_items_order_idx" ON "_products_v_version_picker_steps_items" USING btree ("_order");
  CREATE INDEX "_products_v_version_picker_steps_items_parent_id_idx" ON "_products_v_version_picker_steps_items" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_picker_steps_items_product_idx" ON "_products_v_version_picker_steps_items" USING btree ("product_id");
  CREATE INDEX "_products_v_version_picker_steps_order_idx" ON "_products_v_version_picker_steps" USING btree ("_order");
  CREATE INDEX "_products_v_version_picker_steps_parent_id_idx" ON "_products_v_version_picker_steps" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_tasks_order_idx" ON "_products_v_version_tasks" USING btree ("_order");
  CREATE INDEX "_products_v_version_tasks_parent_id_idx" ON "_products_v_version_tasks" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_properties_order_idx" ON "_products_v_version_properties" USING btree ("_order");
  CREATE INDEX "_products_v_version_properties_parent_id_idx" ON "_products_v_version_properties" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_faq_order_idx" ON "_products_v_version_faq" USING btree ("_order");
  CREATE INDEX "_products_v_version_faq_parent_id_idx" ON "_products_v_version_faq" USING btree ("_parent_id");
  CREATE INDEX "_products_v_parent_idx" ON "_products_v" USING btree ("parent_id");
  CREATE INDEX "_products_v_version_version_slug_idx" ON "_products_v" USING btree ("version_slug");
  CREATE INDEX "_products_v_version_version_manufacturer_idx" ON "_products_v" USING btree ("version_manufacturer_id");
  CREATE INDEX "_products_v_version_version_line_idx" ON "_products_v" USING btree ("version_line_id");
  CREATE INDEX "_products_v_version_version_main_section_idx" ON "_products_v" USING btree ("version_main_section_id");
  CREATE INDEX "_products_v_version_version_legacy_key_idx" ON "_products_v" USING btree ("version_legacy_key");
  CREATE INDEX "_products_v_version_version_updated_by_idx" ON "_products_v" USING btree ("version_updated_by_id");
  CREATE INDEX "_products_v_version_version_updated_at_idx" ON "_products_v" USING btree ("version_updated_at");
  CREATE INDEX "_products_v_version_version_created_at_idx" ON "_products_v" USING btree ("version_created_at");
  CREATE INDEX "_products_v_created_at_idx" ON "_products_v" USING btree ("created_at");
  CREATE INDEX "_products_v_updated_at_idx" ON "_products_v" USING btree ("updated_at");
  CREATE INDEX "_products_v_texts_order_parent" ON "_products_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "_products_v_rels_order_idx" ON "_products_v_rels" USING btree ("order");
  CREATE INDEX "_products_v_rels_parent_idx" ON "_products_v_rels" USING btree ("parent_id");
  CREATE INDEX "_products_v_rels_path_idx" ON "_products_v_rels" USING btree ("path");
  CREATE INDEX "_products_v_rels_sections_id_idx" ON "_products_v_rels" USING btree ("sections_id");
  CREATE INDEX "_products_v_rels_offers_id_idx" ON "_products_v_rels" USING btree ("offers_id");
  CREATE INDEX "_products_v_rels_products_id_idx" ON "_products_v_rels" USING btree ("products_id");
  CREATE INDEX "_products_v_rels_media_id_idx" ON "_products_v_rels" USING btree ("media_id");
  CREATE INDEX "_offers_v_parent_idx" ON "_offers_v" USING btree ("parent_id");
  CREATE INDEX "_offers_v_version_version_product_idx" ON "_offers_v" USING btree ("version_product_id");
  CREATE INDEX "_offers_v_version_version_legacy_key_idx" ON "_offers_v" USING btree ("version_legacy_key");
  CREATE INDEX "_offers_v_version_version_updated_by_idx" ON "_offers_v" USING btree ("version_updated_by_id");
  CREATE INDEX "_offers_v_version_version_updated_at_idx" ON "_offers_v" USING btree ("version_updated_at");
  CREATE INDEX "_offers_v_version_version_created_at_idx" ON "_offers_v" USING btree ("version_created_at");
  CREATE INDEX "_offers_v_created_at_idx" ON "_offers_v" USING btree ("created_at");
  CREATE INDEX "_offers_v_updated_at_idx" ON "_offers_v" USING btree ("updated_at");
  CREATE INDEX "_offers_v_texts_order_parent" ON "_offers_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "_sections_v_parent_idx" ON "_sections_v" USING btree ("parent_id");
  CREATE INDEX "_sections_v_version_version_slug_idx" ON "_sections_v" USING btree ("version_slug");
  CREATE INDEX "_sections_v_version_version_parent_idx" ON "_sections_v" USING btree ("version_parent_id");
  CREATE INDEX "_sections_v_version_version_legacy_key_idx" ON "_sections_v" USING btree ("version_legacy_key");
  CREATE INDEX "_sections_v_version_version_updated_by_idx" ON "_sections_v" USING btree ("version_updated_by_id");
  CREATE INDEX "_sections_v_version_version_updated_at_idx" ON "_sections_v" USING btree ("version_updated_at");
  CREATE INDEX "_sections_v_version_version_created_at_idx" ON "_sections_v" USING btree ("version_created_at");
  CREATE INDEX "_sections_v_created_at_idx" ON "_sections_v" USING btree ("created_at");
  CREATE INDEX "_sections_v_updated_at_idx" ON "_sections_v" USING btree ("updated_at");
  CREATE INDEX "_sections_v_rels_order_idx" ON "_sections_v_rels" USING btree ("order");
  CREATE INDEX "_sections_v_rels_parent_idx" ON "_sections_v_rels" USING btree ("parent_id");
  CREATE INDEX "_sections_v_rels_path_idx" ON "_sections_v_rels" USING btree ("path");
  CREATE INDEX "_sections_v_rels_manufacturers_id_idx" ON "_sections_v_rels" USING btree ("manufacturers_id");
  CREATE INDEX "_sections_v_rels_sections_id_idx" ON "_sections_v_rels" USING btree ("sections_id");
  CREATE INDEX "_manufacturers_v_parent_idx" ON "_manufacturers_v" USING btree ("parent_id");
  CREATE INDEX "_manufacturers_v_version_version_image_idx" ON "_manufacturers_v" USING btree ("version_image_id");
  CREATE INDEX "_manufacturers_v_version_version_legacy_key_idx" ON "_manufacturers_v" USING btree ("version_legacy_key");
  CREATE INDEX "_manufacturers_v_version_version_updated_by_idx" ON "_manufacturers_v" USING btree ("version_updated_by_id");
  CREATE INDEX "_manufacturers_v_version_version_updated_at_idx" ON "_manufacturers_v" USING btree ("version_updated_at");
  CREATE INDEX "_manufacturers_v_version_version_created_at_idx" ON "_manufacturers_v" USING btree ("version_created_at");
  CREATE INDEX "_manufacturers_v_created_at_idx" ON "_manufacturers_v" USING btree ("created_at");
  CREATE INDEX "_manufacturers_v_updated_at_idx" ON "_manufacturers_v" USING btree ("updated_at");
  CREATE INDEX "_section_rules_v_parent_idx" ON "_section_rules_v" USING btree ("parent_id");
  CREATE INDEX "_section_rules_v_version_version_manufacturer_idx" ON "_section_rules_v" USING btree ("version_manufacturer_id");
  CREATE INDEX "_section_rules_v_version_version_main_section_idx" ON "_section_rules_v" USING btree ("version_main_section_id");
  CREATE INDEX "_section_rules_v_version_version_updated_by_idx" ON "_section_rules_v" USING btree ("version_updated_by_id");
  CREATE INDEX "_section_rules_v_version_version_updated_at_idx" ON "_section_rules_v" USING btree ("version_updated_at");
  CREATE INDEX "_section_rules_v_version_version_created_at_idx" ON "_section_rules_v" USING btree ("version_created_at");
  CREATE INDEX "_section_rules_v_created_at_idx" ON "_section_rules_v" USING btree ("created_at");
  CREATE INDEX "_section_rules_v_updated_at_idx" ON "_section_rules_v" USING btree ("updated_at");
  CREATE INDEX "_section_rules_v_rels_order_idx" ON "_section_rules_v_rels" USING btree ("order");
  CREATE INDEX "_section_rules_v_rels_parent_idx" ON "_section_rules_v_rels" USING btree ("parent_id");
  CREATE INDEX "_section_rules_v_rels_path_idx" ON "_section_rules_v_rels" USING btree ("path");
  CREATE INDEX "_section_rules_v_rels_sections_id_idx" ON "_section_rules_v_rels" USING btree ("sections_id");
  CREATE INDEX "_publications_v_parent_idx" ON "_publications_v" USING btree ("parent_id");
  CREATE INDEX "_publications_v_version_version_slug_idx" ON "_publications_v" USING btree ("version_slug");
  CREATE INDEX "_publications_v_version_version_theme_idx" ON "_publications_v" USING btree ("version_theme_id");
  CREATE INDEX "_publications_v_version_version_cover_idx" ON "_publications_v" USING btree ("version_cover_id");
  CREATE INDEX "_publications_v_version_version_legacy_key_idx" ON "_publications_v" USING btree ("version_legacy_key");
  CREATE INDEX "_publications_v_version_version_updated_by_idx" ON "_publications_v" USING btree ("version_updated_by_id");
  CREATE INDEX "_publications_v_version_version_updated_at_idx" ON "_publications_v" USING btree ("version_updated_at");
  CREATE INDEX "_publications_v_version_version_created_at_idx" ON "_publications_v" USING btree ("version_created_at");
  CREATE INDEX "_publications_v_created_at_idx" ON "_publications_v" USING btree ("created_at");
  CREATE INDEX "_publications_v_updated_at_idx" ON "_publications_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_version_legacy_key_idx" ON "_pages_v" USING btree ("version_legacy_key");
  CREATE INDEX "_pages_v_version_version_updated_by_idx" ON "_pages_v" USING btree ("version_updated_by_id");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_assistant_knowledge_v_parent_idx" ON "_assistant_knowledge_v" USING btree ("parent_id");
  CREATE INDEX "_assistant_knowledge_v_version_version_updated_by_idx" ON "_assistant_knowledge_v" USING btree ("version_updated_by_id");
  CREATE INDEX "_assistant_knowledge_v_version_version_updated_at_idx" ON "_assistant_knowledge_v" USING btree ("version_updated_at");
  CREATE INDEX "_assistant_knowledge_v_version_version_created_at_idx" ON "_assistant_knowledge_v" USING btree ("version_created_at");
  CREATE INDEX "_assistant_knowledge_v_created_at_idx" ON "_assistant_knowledge_v" USING btree ("created_at");
  CREATE INDEX "_assistant_knowledge_v_updated_at_idx" ON "_assistant_knowledge_v" USING btree ("updated_at");
  CREATE INDEX "activity_log_action_idx" ON "activity_log" USING btree ("action");
  CREATE INDEX "activity_log_user_idx" ON "activity_log" USING btree ("user_id");
  CREATE INDEX "activity_log_updated_at_idx" ON "activity_log" USING btree ("updated_at");
  CREATE INDEX "activity_log_created_at_idx" ON "activity_log" USING btree ("created_at");
  CREATE INDEX "_pricing_settings_v_version_version_updated_by_idx" ON "_pricing_settings_v" USING btree ("version_updated_by_id");
  CREATE INDEX "_pricing_settings_v_created_at_idx" ON "_pricing_settings_v" USING btree ("created_at");
  CREATE INDEX "_pricing_settings_v_updated_at_idx" ON "_pricing_settings_v" USING btree ("updated_at");
  CREATE INDEX "_home_page_v_version_side_cards_order_idx" ON "_home_page_v_version_side_cards" USING btree ("_order");
  CREATE INDEX "_home_page_v_version_side_cards_parent_id_idx" ON "_home_page_v_version_side_cards" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_trust_partners_order_idx" ON "_home_page_v_version_trust_partners" USING btree ("_order");
  CREATE INDEX "_home_page_v_version_trust_partners_parent_id_idx" ON "_home_page_v_version_trust_partners" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_trust_partners_logo_idx" ON "_home_page_v_version_trust_partners" USING btree ("logo_id");
  CREATE INDEX "_home_page_v_version_trust_links_order_idx" ON "_home_page_v_version_trust_links" USING btree ("_order");
  CREATE INDEX "_home_page_v_version_trust_links_parent_id_idx" ON "_home_page_v_version_trust_links" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_popular_items_order_idx" ON "_home_page_v_version_popular_items" USING btree ("_order");
  CREATE INDEX "_home_page_v_version_popular_items_parent_id_idx" ON "_home_page_v_version_popular_items" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_popular_items_product_idx" ON "_home_page_v_version_popular_items" USING btree ("product_id");
  CREATE INDEX "_home_page_v_version_bim_stages_order_idx" ON "_home_page_v_version_bim_stages" USING btree ("_order");
  CREATE INDEX "_home_page_v_version_bim_stages_parent_id_idx" ON "_home_page_v_version_bim_stages" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_bim_stats_order_idx" ON "_home_page_v_version_bim_stats" USING btree ("_order");
  CREATE INDEX "_home_page_v_version_bim_stats_parent_id_idx" ON "_home_page_v_version_bim_stats" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_process_order_idx" ON "_home_page_v_version_process" USING btree ("_order");
  CREATE INDEX "_home_page_v_version_process_parent_id_idx" ON "_home_page_v_version_process" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_faq_order_idx" ON "_home_page_v_version_faq" USING btree ("_order");
  CREATE INDEX "_home_page_v_version_faq_parent_id_idx" ON "_home_page_v_version_faq" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_version_updated_by_idx" ON "_home_page_v" USING btree ("version_updated_by_id");
  CREATE INDEX "_home_page_v_created_at_idx" ON "_home_page_v" USING btree ("created_at");
  CREATE INDEX "_home_page_v_updated_at_idx" ON "_home_page_v" USING btree ("updated_at");
  CREATE INDEX "_site_settings_v_version_phones_order_idx" ON "_site_settings_v_version_phones" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_phones_parent_id_idx" ON "_site_settings_v_version_phones" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_socials_order_idx" ON "_site_settings_v_version_socials" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_socials_parent_id_idx" ON "_site_settings_v_version_socials" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_version_updated_by_idx" ON "_site_settings_v" USING btree ("version_updated_by_id");
  CREATE INDEX "_site_settings_v_created_at_idx" ON "_site_settings_v" USING btree ("created_at");
  CREATE INDEX "_site_settings_v_updated_at_idx" ON "_site_settings_v" USING btree ("updated_at");
  ALTER TABLE "products" ADD CONSTRAINT "products_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "offers" ADD CONSTRAINT "offers_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sections" ADD CONSTRAINT "sections_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "section_rules" ADD CONSTRAINT "section_rules_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "manufacturers" ADD CONSTRAINT "manufacturers_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "publications" ADD CONSTRAINT "publications_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "assistant_knowledge" ADD CONSTRAINT "assistant_knowledge_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_activity_log_fk" FOREIGN KEY ("activity_log_id") REFERENCES "public"."activity_log"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pricing_settings" ADD CONSTRAINT "pricing_settings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page" ADD CONSTRAINT "home_page_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "products_updated_by_idx" ON "products" USING btree ("updated_by_id");
  CREATE INDEX "offers_updated_by_idx" ON "offers" USING btree ("updated_by_id");
  CREATE INDEX "sections_updated_by_idx" ON "sections" USING btree ("updated_by_id");
  CREATE INDEX "section_rules_updated_by_idx" ON "section_rules" USING btree ("updated_by_id");
  CREATE INDEX "manufacturers_updated_by_idx" ON "manufacturers" USING btree ("updated_by_id");
  CREATE INDEX "publications_updated_by_idx" ON "publications" USING btree ("updated_by_id");
  CREATE INDEX "pages_updated_by_idx" ON "pages" USING btree ("updated_by_id");
  CREATE INDEX "assistant_knowledge_updated_by_idx" ON "assistant_knowledge" USING btree ("updated_by_id");
  CREATE INDEX "payload_locked_documents_rels_activity_log_id_idx" ON "payload_locked_documents_rels" USING btree ("activity_log_id");
  CREATE INDEX "pricing_settings_updated_by_idx" ON "pricing_settings" USING btree ("updated_by_id");
  CREATE INDEX "site_settings_updated_by_idx" ON "site_settings" USING btree ("updated_by_id");
  CREATE INDEX "home_page_updated_by_idx" ON "home_page" USING btree ("updated_by_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_products_v_version_picker_switches_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_products_v_version_picker_switches" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_products_v_version_picker_steps_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_products_v_version_picker_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_products_v_version_tasks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_products_v_version_properties" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_products_v_version_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_products_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_products_v_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_products_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_offers_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_offers_v_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sections_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sections_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_manufacturers_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_section_rules_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_section_rules_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_publications_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_assistant_knowledge_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "activity_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pricing_settings_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_home_page_v_version_side_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_home_page_v_version_trust_partners" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_home_page_v_version_trust_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_home_page_v_version_popular_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_home_page_v_version_bim_stages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_home_page_v_version_bim_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_home_page_v_version_process" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_home_page_v_version_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_home_page_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_settings_v_version_phones" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_settings_v_version_socials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_settings_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "_products_v_version_picker_switches_options" CASCADE;
  DROP TABLE "_products_v_version_picker_switches" CASCADE;
  DROP TABLE "_products_v_version_picker_steps_items" CASCADE;
  DROP TABLE "_products_v_version_picker_steps" CASCADE;
  DROP TABLE "_products_v_version_tasks" CASCADE;
  DROP TABLE "_products_v_version_properties" CASCADE;
  DROP TABLE "_products_v_version_faq" CASCADE;
  DROP TABLE "_products_v" CASCADE;
  DROP TABLE "_products_v_texts" CASCADE;
  DROP TABLE "_products_v_rels" CASCADE;
  DROP TABLE "_offers_v" CASCADE;
  DROP TABLE "_offers_v_texts" CASCADE;
  DROP TABLE "_sections_v" CASCADE;
  DROP TABLE "_sections_v_rels" CASCADE;
  DROP TABLE "_manufacturers_v" CASCADE;
  DROP TABLE "_section_rules_v" CASCADE;
  DROP TABLE "_section_rules_v_rels" CASCADE;
  DROP TABLE "_publications_v" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "_assistant_knowledge_v" CASCADE;
  DROP TABLE "activity_log" CASCADE;
  DROP TABLE "_pricing_settings_v" CASCADE;
  DROP TABLE "_home_page_v_version_side_cards" CASCADE;
  DROP TABLE "_home_page_v_version_trust_partners" CASCADE;
  DROP TABLE "_home_page_v_version_trust_links" CASCADE;
  DROP TABLE "_home_page_v_version_popular_items" CASCADE;
  DROP TABLE "_home_page_v_version_bim_stages" CASCADE;
  DROP TABLE "_home_page_v_version_bim_stats" CASCADE;
  DROP TABLE "_home_page_v_version_process" CASCADE;
  DROP TABLE "_home_page_v_version_faq" CASCADE;
  DROP TABLE "_home_page_v" CASCADE;
  DROP TABLE "_site_settings_v_version_phones" CASCADE;
  DROP TABLE "_site_settings_v_version_socials" CASCADE;
  DROP TABLE "_site_settings_v" CASCADE;
  ALTER TABLE "products" DROP CONSTRAINT "products_updated_by_id_users_id_fk";
  
  ALTER TABLE "offers" DROP CONSTRAINT "offers_updated_by_id_users_id_fk";
  
  ALTER TABLE "sections" DROP CONSTRAINT "sections_updated_by_id_users_id_fk";
  
  ALTER TABLE "manufacturers" DROP CONSTRAINT "manufacturers_updated_by_id_users_id_fk";
  
  ALTER TABLE "section_rules" DROP CONSTRAINT "section_rules_updated_by_id_users_id_fk";
  
  ALTER TABLE "publications" DROP CONSTRAINT "publications_updated_by_id_users_id_fk";
  
  ALTER TABLE "pages" DROP CONSTRAINT "pages_updated_by_id_users_id_fk";
  
  ALTER TABLE "assistant_knowledge" DROP CONSTRAINT "assistant_knowledge_updated_by_id_users_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_activity_log_fk";
  
  ALTER TABLE "pricing_settings" DROP CONSTRAINT "pricing_settings_updated_by_id_users_id_fk";
  
  ALTER TABLE "home_page" DROP CONSTRAINT "home_page_updated_by_id_users_id_fk";
  
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_updated_by_id_users_id_fk";
  
  DROP INDEX "products_updated_by_idx";
  DROP INDEX "offers_updated_by_idx";
  DROP INDEX "sections_updated_by_idx";
  DROP INDEX "manufacturers_updated_by_idx";
  DROP INDEX "section_rules_updated_by_idx";
  DROP INDEX "publications_updated_by_idx";
  DROP INDEX "pages_updated_by_idx";
  DROP INDEX "assistant_knowledge_updated_by_idx";
  DROP INDEX "payload_locked_documents_rels_activity_log_id_idx";
  DROP INDEX "pricing_settings_updated_by_idx";
  DROP INDEX "home_page_updated_by_idx";
  DROP INDEX "site_settings_updated_by_idx";
  ALTER TABLE "publications" ALTER COLUMN "kind" SET DEFAULT 'news';
  ALTER TABLE "products" DROP COLUMN "updated_by_id";
  ALTER TABLE "offers" DROP COLUMN "updated_by_id";
  ALTER TABLE "sections" DROP COLUMN "updated_by_id";
  ALTER TABLE "manufacturers" DROP COLUMN "updated_by_id";
  ALTER TABLE "section_rules" DROP COLUMN "updated_by_id";
  ALTER TABLE "publications" DROP COLUMN "updated_by_id";
  ALTER TABLE "pages" DROP COLUMN "updated_by_id";
  ALTER TABLE "assistant_knowledge" DROP COLUMN "updated_by_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "activity_log_id";
  ALTER TABLE "pricing_settings" DROP COLUMN "updated_by_id";
  ALTER TABLE "home_page" DROP COLUMN "updated_by_id";
  ALTER TABLE "site_settings" DROP COLUMN "updated_by_id";
  DROP TYPE "public"."enum__products_v_version_picker_steps_mode";
  DROP TYPE "public"."enum__products_v_version_status";
  DROP TYPE "public"."enum__products_v_version_priority";
  DROP TYPE "public"."enum__products_v_version_scenario";
  DROP TYPE "public"."enum__products_v_version_page_view";
  DROP TYPE "public"."enum__products_v_version_kind";
  DROP TYPE "public"."enum__offers_v_version_status";
  DROP TYPE "public"."enum__offers_v_version_currency";
  DROP TYPE "public"."enum__sections_v_version_status";
  DROP TYPE "public"."enum__sections_v_version_menu_group";
  DROP TYPE "public"."enum__sections_v_version_icon";
  DROP TYPE "public"."enum__sections_v_version_tone";
  DROP TYPE "public"."enum__sections_v_version_scenario";
  DROP TYPE "public"."enum__manufacturers_v_version_status";
  DROP TYPE "public"."enum__manufacturers_v_version_priority";
  DROP TYPE "public"."enum__section_rules_v_version_kind";
  DROP TYPE "public"."enum__publications_v_version_status";
  DROP TYPE "public"."enum__publications_v_version_kind";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum_activity_log_action";
  DROP TYPE "public"."enum__site_settings_v_version_socials_network";`)
}
