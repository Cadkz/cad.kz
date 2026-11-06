import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('ru', 'kk', 'en');
  CREATE TABLE "products_tasks_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "products_faq_locales" (
  	"question" varchar,
  	"answer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "products_locales" (
  	"title" varchar,
  	"summary" varchar,
  	"description" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_products_v_version_tasks_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_products_v_version_faq_locales" (
  	"question" varchar,
  	"answer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_products_v_locales" (
  	"version_title" varchar,
  	"version_summary" varchar,
  	"version_description" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "publications_locales" (
  	"excerpt" varchar,
  	"body" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_publications_v_locales" (
  	"version_excerpt" varchar,
  	"version_body" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "pages_locales" (
  	"lead" varchar,
  	"body" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_locales" (
  	"version_lead" varchar,
  	"version_body" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "sections_locales" (
  	"title" varchar,
  	"summary" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_sections_v_locales" (
  	"version_title" varchar,
  	"version_summary" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "home_page_hero_tasks_locales" (
  	"label" varchar,
  	"question" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "home_page_side_cards_locales" (
  	"title" varchar,
  	"text" varchar,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "home_page_trust_partners_locales" (
  	"status" varchar,
  	"note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "home_page_trust_links_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "home_page_popular_items_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "home_page_bim_stages_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "home_page_bim_stats_locales" (
  	"value" varchar,
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "home_page_process_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "home_page_faq_locales" (
  	"question" varchar,
  	"answer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "home_page_locales" (
  	"eyebrow" varchar,
  	"title" varchar,
  	"hero_lead" varchar,
  	"hero_card_title" varchar,
  	"hero_placeholder" varchar,
  	"hero_note" varchar,
  	"trust_title" varchar,
  	"trust_lead" varchar,
  	"popular_title" varchar,
  	"popular_lead" varchar,
  	"renew_title" varchar,
  	"renew_text" varchar,
  	"bim_eyebrow" varchar,
  	"bim_title" varchar,
  	"bim_lead" varchar,
  	"bim_link_label" varchar,
  	"cta_title" varchar,
  	"cta_text" varchar,
  	"cta_link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_home_page_v_version_hero_tasks_locales" (
  	"label" varchar,
  	"question" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_home_page_v_version_side_cards_locales" (
  	"title" varchar,
  	"text" varchar,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_home_page_v_version_trust_partners_locales" (
  	"status" varchar,
  	"note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_home_page_v_version_trust_links_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_home_page_v_version_popular_items_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_home_page_v_version_bim_stages_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_home_page_v_version_bim_stats_locales" (
  	"value" varchar,
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_home_page_v_version_process_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_home_page_v_version_faq_locales" (
  	"question" varchar,
  	"answer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_home_page_v_locales" (
  	"version_eyebrow" varchar,
  	"version_title" varchar,
  	"version_hero_lead" varchar,
  	"version_hero_card_title" varchar,
  	"version_hero_placeholder" varchar,
  	"version_hero_note" varchar,
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
  	"version_cta_title" varchar,
  	"version_cta_text" varchar,
  	"version_cta_link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "site_settings_phones_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_purchase_terms_software_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_purchase_terms_hardware_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_locales" (
  	"address" varchar,
  	"hours" varchar,
  	"footer_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_site_settings_v_version_phones_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_site_settings_v_version_purchase_terms_software_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_site_settings_v_version_purchase_terms_hardware_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_site_settings_v_locales" (
  	"version_address" varchar,
  	"version_hours" varchar,
  	"version_footer_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "products_tasks_locales" ADD CONSTRAINT "products_tasks_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products_tasks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_faq_locales" ADD CONSTRAINT "products_faq_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_locales" ADD CONSTRAINT "products_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_tasks_locales" ADD CONSTRAINT "_products_v_version_tasks_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v_version_tasks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_faq_locales" ADD CONSTRAINT "_products_v_version_faq_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v_version_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_locales" ADD CONSTRAINT "_products_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "publications_locales" ADD CONSTRAINT "publications_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."publications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_publications_v_locales" ADD CONSTRAINT "_publications_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_publications_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_locales" ADD CONSTRAINT "_pages_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sections_locales" ADD CONSTRAINT "sections_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sections_v_locales" ADD CONSTRAINT "_sections_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sections_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_hero_tasks_locales" ADD CONSTRAINT "home_page_hero_tasks_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page_hero_tasks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_side_cards_locales" ADD CONSTRAINT "home_page_side_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page_side_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_trust_partners_locales" ADD CONSTRAINT "home_page_trust_partners_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page_trust_partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_trust_links_locales" ADD CONSTRAINT "home_page_trust_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page_trust_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_popular_items_locales" ADD CONSTRAINT "home_page_popular_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page_popular_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_bim_stages_locales" ADD CONSTRAINT "home_page_bim_stages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page_bim_stages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_bim_stats_locales" ADD CONSTRAINT "home_page_bim_stats_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page_bim_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_process_locales" ADD CONSTRAINT "home_page_process_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page_process"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_faq_locales" ADD CONSTRAINT "home_page_faq_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_locales" ADD CONSTRAINT "home_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_hero_tasks_locales" ADD CONSTRAINT "_home_page_v_version_hero_tasks_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v_version_hero_tasks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_side_cards_locales" ADD CONSTRAINT "_home_page_v_version_side_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v_version_side_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_trust_partners_locales" ADD CONSTRAINT "_home_page_v_version_trust_partners_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v_version_trust_partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_trust_links_locales" ADD CONSTRAINT "_home_page_v_version_trust_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v_version_trust_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_popular_items_locales" ADD CONSTRAINT "_home_page_v_version_popular_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v_version_popular_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_bim_stages_locales" ADD CONSTRAINT "_home_page_v_version_bim_stages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v_version_bim_stages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_bim_stats_locales" ADD CONSTRAINT "_home_page_v_version_bim_stats_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v_version_bim_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_process_locales" ADD CONSTRAINT "_home_page_v_version_process_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v_version_process"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_faq_locales" ADD CONSTRAINT "_home_page_v_version_faq_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v_version_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_locales" ADD CONSTRAINT "_home_page_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_phones_locales" ADD CONSTRAINT "site_settings_phones_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_phones"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_purchase_terms_software_locales" ADD CONSTRAINT "site_settings_purchase_terms_software_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_purchase_terms_software"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_purchase_terms_hardware_locales" ADD CONSTRAINT "site_settings_purchase_terms_hardware_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_purchase_terms_hardware"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_locales" ADD CONSTRAINT "site_settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_phones_locales" ADD CONSTRAINT "_site_settings_v_version_phones_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v_version_phones"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_purchase_terms_software_locales" ADD CONSTRAINT "_site_settings_v_version_purchase_terms_software_locales__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v_version_purchase_terms_software"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_purchase_terms_hardware_locales" ADD CONSTRAINT "_site_settings_v_version_purchase_terms_hardware_locales__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v_version_purchase_terms_hardware"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_locales" ADD CONSTRAINT "_site_settings_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "products_tasks_locales_locale_parent_id_unique" ON "products_tasks_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "products_faq_locales_locale_parent_id_unique" ON "products_faq_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "products_locales_locale_parent_id_unique" ON "products_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_products_v_version_tasks_locales_locale_parent_id_unique" ON "_products_v_version_tasks_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_products_v_version_faq_locales_locale_parent_id_unique" ON "_products_v_version_faq_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_products_v_locales_locale_parent_id_unique" ON "_products_v_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "publications_locales_locale_parent_id_unique" ON "publications_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_publications_v_locales_locale_parent_id_unique" ON "_publications_v_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "pages_locales_locale_parent_id_unique" ON "pages_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_pages_v_locales_locale_parent_id_unique" ON "_pages_v_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "sections_locales_locale_parent_id_unique" ON "sections_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_sections_v_locales_locale_parent_id_unique" ON "_sections_v_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "home_page_hero_tasks_locales_locale_parent_id_unique" ON "home_page_hero_tasks_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "home_page_side_cards_locales_locale_parent_id_unique" ON "home_page_side_cards_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "home_page_trust_partners_locales_locale_parent_id_unique" ON "home_page_trust_partners_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "home_page_trust_links_locales_locale_parent_id_unique" ON "home_page_trust_links_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "home_page_popular_items_locales_locale_parent_id_unique" ON "home_page_popular_items_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "home_page_bim_stages_locales_locale_parent_id_unique" ON "home_page_bim_stages_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "home_page_bim_stats_locales_locale_parent_id_unique" ON "home_page_bim_stats_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "home_page_process_locales_locale_parent_id_unique" ON "home_page_process_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "home_page_faq_locales_locale_parent_id_unique" ON "home_page_faq_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "home_page_locales_locale_parent_id_unique" ON "home_page_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_home_page_v_version_hero_tasks_locales_locale_parent_id_uni" ON "_home_page_v_version_hero_tasks_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_home_page_v_version_side_cards_locales_locale_parent_id_uni" ON "_home_page_v_version_side_cards_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_home_page_v_version_trust_partners_locales_locale_parent_id" ON "_home_page_v_version_trust_partners_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_home_page_v_version_trust_links_locales_locale_parent_id_un" ON "_home_page_v_version_trust_links_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_home_page_v_version_popular_items_locales_locale_parent_id_" ON "_home_page_v_version_popular_items_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_home_page_v_version_bim_stages_locales_locale_parent_id_uni" ON "_home_page_v_version_bim_stages_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_home_page_v_version_bim_stats_locales_locale_parent_id_uniq" ON "_home_page_v_version_bim_stats_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_home_page_v_version_process_locales_locale_parent_id_unique" ON "_home_page_v_version_process_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_home_page_v_version_faq_locales_locale_parent_id_unique" ON "_home_page_v_version_faq_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_home_page_v_locales_locale_parent_id_unique" ON "_home_page_v_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "site_settings_phones_locales_locale_parent_id_unique" ON "site_settings_phones_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "site_settings_purchase_terms_software_locales_locale_parent_" ON "site_settings_purchase_terms_software_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "site_settings_purchase_terms_hardware_locales_locale_parent_" ON "site_settings_purchase_terms_hardware_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "site_settings_locales_locale_parent_id_unique" ON "site_settings_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_site_settings_v_version_phones_locales_locale_parent_id_uni" ON "_site_settings_v_version_phones_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_site_settings_v_version_purchase_terms_software_locales_loc" ON "_site_settings_v_version_purchase_terms_software_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_site_settings_v_version_purchase_terms_hardware_locales_loc" ON "_site_settings_v_version_purchase_terms_hardware_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_site_settings_v_locales_locale_parent_id_unique" ON "_site_settings_v_locales" USING btree ("_locale","_parent_id");
  -- Перенос текущих текстов в русскую версию (06.11.2026): до удаления колонок каждая строка
  -- получает запись _locale = ru в таблице переводов, тексты не теряются. Колонки переводов
  -- без NOT NULL: обязателен только русский текст (validate в src/cms/fields.ts).
  INSERT INTO "products_tasks_locales" ("title", "_locale", "_parent_id")
    SELECT "title", 'ru', "id" FROM "products_tasks";
  INSERT INTO "products_faq_locales" ("question", "answer", "_locale", "_parent_id")
    SELECT "question", "answer", 'ru', "id" FROM "products_faq";
  INSERT INTO "products_locales" ("title", "summary", "description", "seo_title", "seo_description", "_locale", "_parent_id")
    SELECT "title", "summary", "description", "seo_title", "seo_description", 'ru', "id" FROM "products";
  INSERT INTO "_products_v_version_tasks_locales" ("title", "_locale", "_parent_id")
    SELECT "title", 'ru', "id" FROM "_products_v_version_tasks";
  INSERT INTO "_products_v_version_faq_locales" ("question", "answer", "_locale", "_parent_id")
    SELECT "question", "answer", 'ru', "id" FROM "_products_v_version_faq";
  INSERT INTO "_products_v_locales" ("version_title", "version_summary", "version_description", "version_seo_title", "version_seo_description", "_locale", "_parent_id")
    SELECT "version_title", "version_summary", "version_description", "version_seo_title", "version_seo_description", 'ru', "id" FROM "_products_v";
  INSERT INTO "publications_locales" ("excerpt", "body", "seo_title", "seo_description", "_locale", "_parent_id")
    SELECT "excerpt", "body", "seo_title", "seo_description", 'ru', "id" FROM "publications";
  INSERT INTO "_publications_v_locales" ("version_excerpt", "version_body", "version_seo_title", "version_seo_description", "_locale", "_parent_id")
    SELECT "version_excerpt", "version_body", "version_seo_title", "version_seo_description", 'ru', "id" FROM "_publications_v";
  INSERT INTO "pages_locales" ("lead", "body", "seo_title", "seo_description", "_locale", "_parent_id")
    SELECT "lead", "body", "seo_title", "seo_description", 'ru', "id" FROM "pages";
  INSERT INTO "_pages_v_locales" ("version_lead", "version_body", "version_seo_title", "version_seo_description", "_locale", "_parent_id")
    SELECT "version_lead", "version_body", "version_seo_title", "version_seo_description", 'ru', "id" FROM "_pages_v";
  INSERT INTO "sections_locales" ("title", "summary", "_locale", "_parent_id")
    SELECT "title", "summary", 'ru', "id" FROM "sections";
  INSERT INTO "_sections_v_locales" ("version_title", "version_summary", "_locale", "_parent_id")
    SELECT "version_title", "version_summary", 'ru', "id" FROM "_sections_v";
  INSERT INTO "home_page_hero_tasks_locales" ("label", "question", "_locale", "_parent_id")
    SELECT "label", "question", 'ru', "id" FROM "home_page_hero_tasks";
  INSERT INTO "home_page_side_cards_locales" ("title", "text", "link_label", "_locale", "_parent_id")
    SELECT "title", "text", "link_label", 'ru', "id" FROM "home_page_side_cards";
  INSERT INTO "home_page_trust_partners_locales" ("status", "note", "_locale", "_parent_id")
    SELECT "status", "note", 'ru', "id" FROM "home_page_trust_partners";
  INSERT INTO "home_page_trust_links_locales" ("label", "_locale", "_parent_id")
    SELECT "label", 'ru', "id" FROM "home_page_trust_links";
  INSERT INTO "home_page_popular_items_locales" ("title", "_locale", "_parent_id")
    SELECT "title", 'ru', "id" FROM "home_page_popular_items";
  INSERT INTO "home_page_bim_stages_locales" ("title", "text", "_locale", "_parent_id")
    SELECT "title", "text", 'ru', "id" FROM "home_page_bim_stages";
  INSERT INTO "home_page_bim_stats_locales" ("value", "label", "_locale", "_parent_id")
    SELECT "value", "label", 'ru', "id" FROM "home_page_bim_stats";
  INSERT INTO "home_page_process_locales" ("title", "text", "_locale", "_parent_id")
    SELECT "title", "text", 'ru', "id" FROM "home_page_process";
  INSERT INTO "home_page_faq_locales" ("question", "answer", "_locale", "_parent_id")
    SELECT "question", "answer", 'ru', "id" FROM "home_page_faq";
  INSERT INTO "home_page_locales" ("eyebrow", "title", "hero_lead", "hero_card_title", "hero_placeholder", "hero_note", "trust_title", "trust_lead", "popular_title", "popular_lead", "renew_title", "renew_text", "bim_eyebrow", "bim_title", "bim_lead", "bim_link_label", "cta_title", "cta_text", "cta_link_label", "_locale", "_parent_id")
    SELECT "eyebrow", "title", "hero_lead", "hero_card_title", "hero_placeholder", "hero_note", "trust_title", "trust_lead", "popular_title", "popular_lead", "renew_title", "renew_text", "bim_eyebrow", "bim_title", "bim_lead", "bim_link_label", "cta_title", "cta_text", "cta_link_label", 'ru', "id" FROM "home_page";
  INSERT INTO "_home_page_v_version_hero_tasks_locales" ("label", "question", "_locale", "_parent_id")
    SELECT "label", "question", 'ru', "id" FROM "_home_page_v_version_hero_tasks";
  INSERT INTO "_home_page_v_version_side_cards_locales" ("title", "text", "link_label", "_locale", "_parent_id")
    SELECT "title", "text", "link_label", 'ru', "id" FROM "_home_page_v_version_side_cards";
  INSERT INTO "_home_page_v_version_trust_partners_locales" ("status", "note", "_locale", "_parent_id")
    SELECT "status", "note", 'ru', "id" FROM "_home_page_v_version_trust_partners";
  INSERT INTO "_home_page_v_version_trust_links_locales" ("label", "_locale", "_parent_id")
    SELECT "label", 'ru', "id" FROM "_home_page_v_version_trust_links";
  INSERT INTO "_home_page_v_version_popular_items_locales" ("title", "_locale", "_parent_id")
    SELECT "title", 'ru', "id" FROM "_home_page_v_version_popular_items";
  INSERT INTO "_home_page_v_version_bim_stages_locales" ("title", "text", "_locale", "_parent_id")
    SELECT "title", "text", 'ru', "id" FROM "_home_page_v_version_bim_stages";
  INSERT INTO "_home_page_v_version_bim_stats_locales" ("value", "label", "_locale", "_parent_id")
    SELECT "value", "label", 'ru', "id" FROM "_home_page_v_version_bim_stats";
  INSERT INTO "_home_page_v_version_process_locales" ("title", "text", "_locale", "_parent_id")
    SELECT "title", "text", 'ru', "id" FROM "_home_page_v_version_process";
  INSERT INTO "_home_page_v_version_faq_locales" ("question", "answer", "_locale", "_parent_id")
    SELECT "question", "answer", 'ru', "id" FROM "_home_page_v_version_faq";
  INSERT INTO "_home_page_v_locales" ("version_eyebrow", "version_title", "version_hero_lead", "version_hero_card_title", "version_hero_placeholder", "version_hero_note", "version_trust_title", "version_trust_lead", "version_popular_title", "version_popular_lead", "version_renew_title", "version_renew_text", "version_bim_eyebrow", "version_bim_title", "version_bim_lead", "version_bim_link_label", "version_cta_title", "version_cta_text", "version_cta_link_label", "_locale", "_parent_id")
    SELECT "version_eyebrow", "version_title", "version_hero_lead", "version_hero_card_title", "version_hero_placeholder", "version_hero_note", "version_trust_title", "version_trust_lead", "version_popular_title", "version_popular_lead", "version_renew_title", "version_renew_text", "version_bim_eyebrow", "version_bim_title", "version_bim_lead", "version_bim_link_label", "version_cta_title", "version_cta_text", "version_cta_link_label", 'ru', "id" FROM "_home_page_v";
  INSERT INTO "site_settings_phones_locales" ("label", "_locale", "_parent_id")
    SELECT "label", 'ru', "id" FROM "site_settings_phones";
  INSERT INTO "site_settings_purchase_terms_software_locales" ("title", "text", "_locale", "_parent_id")
    SELECT "title", "text", 'ru', "id" FROM "site_settings_purchase_terms_software";
  INSERT INTO "site_settings_purchase_terms_hardware_locales" ("title", "text", "_locale", "_parent_id")
    SELECT "title", "text", 'ru', "id" FROM "site_settings_purchase_terms_hardware";
  INSERT INTO "site_settings_locales" ("address", "hours", "footer_text", "_locale", "_parent_id")
    SELECT "address", "hours", "footer_text", 'ru', "id" FROM "site_settings";
  INSERT INTO "_site_settings_v_version_phones_locales" ("label", "_locale", "_parent_id")
    SELECT "label", 'ru', "id" FROM "_site_settings_v_version_phones";
  INSERT INTO "_site_settings_v_version_purchase_terms_software_locales" ("title", "text", "_locale", "_parent_id")
    SELECT "title", "text", 'ru', "id" FROM "_site_settings_v_version_purchase_terms_software";
  INSERT INTO "_site_settings_v_version_purchase_terms_hardware_locales" ("title", "text", "_locale", "_parent_id")
    SELECT "title", "text", 'ru', "id" FROM "_site_settings_v_version_purchase_terms_hardware";
  INSERT INTO "_site_settings_v_locales" ("version_address", "version_hours", "version_footer_text", "_locale", "_parent_id")
    SELECT "version_address", "version_hours", "version_footer_text", 'ru', "id" FROM "_site_settings_v";
  ALTER TABLE "products_tasks" DROP COLUMN "title";
  ALTER TABLE "products_faq" DROP COLUMN "question";
  ALTER TABLE "products_faq" DROP COLUMN "answer";
  ALTER TABLE "products" DROP COLUMN "title";
  ALTER TABLE "products" DROP COLUMN "summary";
  ALTER TABLE "products" DROP COLUMN "description";
  ALTER TABLE "products" DROP COLUMN "seo_title";
  ALTER TABLE "products" DROP COLUMN "seo_description";
  ALTER TABLE "_products_v_version_tasks" DROP COLUMN "title";
  ALTER TABLE "_products_v_version_faq" DROP COLUMN "question";
  ALTER TABLE "_products_v_version_faq" DROP COLUMN "answer";
  ALTER TABLE "_products_v" DROP COLUMN "version_title";
  ALTER TABLE "_products_v" DROP COLUMN "version_summary";
  ALTER TABLE "_products_v" DROP COLUMN "version_description";
  ALTER TABLE "_products_v" DROP COLUMN "version_seo_title";
  ALTER TABLE "_products_v" DROP COLUMN "version_seo_description";
  ALTER TABLE "publications" DROP COLUMN "excerpt";
  ALTER TABLE "publications" DROP COLUMN "body";
  ALTER TABLE "publications" DROP COLUMN "seo_title";
  ALTER TABLE "publications" DROP COLUMN "seo_description";
  ALTER TABLE "_publications_v" DROP COLUMN "version_excerpt";
  ALTER TABLE "_publications_v" DROP COLUMN "version_body";
  ALTER TABLE "_publications_v" DROP COLUMN "version_seo_title";
  ALTER TABLE "_publications_v" DROP COLUMN "version_seo_description";
  ALTER TABLE "pages" DROP COLUMN "lead";
  ALTER TABLE "pages" DROP COLUMN "body";
  ALTER TABLE "pages" DROP COLUMN "seo_title";
  ALTER TABLE "pages" DROP COLUMN "seo_description";
  ALTER TABLE "_pages_v" DROP COLUMN "version_lead";
  ALTER TABLE "_pages_v" DROP COLUMN "version_body";
  ALTER TABLE "_pages_v" DROP COLUMN "version_seo_title";
  ALTER TABLE "_pages_v" DROP COLUMN "version_seo_description";
  ALTER TABLE "sections" DROP COLUMN "title";
  ALTER TABLE "sections" DROP COLUMN "summary";
  ALTER TABLE "_sections_v" DROP COLUMN "version_title";
  ALTER TABLE "_sections_v" DROP COLUMN "version_summary";
  ALTER TABLE "home_page_hero_tasks" DROP COLUMN "label";
  ALTER TABLE "home_page_hero_tasks" DROP COLUMN "question";
  ALTER TABLE "home_page_side_cards" DROP COLUMN "title";
  ALTER TABLE "home_page_side_cards" DROP COLUMN "text";
  ALTER TABLE "home_page_side_cards" DROP COLUMN "link_label";
  ALTER TABLE "home_page_trust_partners" DROP COLUMN "status";
  ALTER TABLE "home_page_trust_partners" DROP COLUMN "note";
  ALTER TABLE "home_page_trust_links" DROP COLUMN "label";
  ALTER TABLE "home_page_popular_items" DROP COLUMN "title";
  ALTER TABLE "home_page_bim_stages" DROP COLUMN "title";
  ALTER TABLE "home_page_bim_stages" DROP COLUMN "text";
  ALTER TABLE "home_page_bim_stats" DROP COLUMN "value";
  ALTER TABLE "home_page_bim_stats" DROP COLUMN "label";
  ALTER TABLE "home_page_process" DROP COLUMN "title";
  ALTER TABLE "home_page_process" DROP COLUMN "text";
  ALTER TABLE "home_page_faq" DROP COLUMN "question";
  ALTER TABLE "home_page_faq" DROP COLUMN "answer";
  ALTER TABLE "home_page" DROP COLUMN "eyebrow";
  ALTER TABLE "home_page" DROP COLUMN "title";
  ALTER TABLE "home_page" DROP COLUMN "hero_lead";
  ALTER TABLE "home_page" DROP COLUMN "hero_card_title";
  ALTER TABLE "home_page" DROP COLUMN "hero_placeholder";
  ALTER TABLE "home_page" DROP COLUMN "hero_note";
  ALTER TABLE "home_page" DROP COLUMN "trust_title";
  ALTER TABLE "home_page" DROP COLUMN "trust_lead";
  ALTER TABLE "home_page" DROP COLUMN "popular_title";
  ALTER TABLE "home_page" DROP COLUMN "popular_lead";
  ALTER TABLE "home_page" DROP COLUMN "renew_title";
  ALTER TABLE "home_page" DROP COLUMN "renew_text";
  ALTER TABLE "home_page" DROP COLUMN "bim_eyebrow";
  ALTER TABLE "home_page" DROP COLUMN "bim_title";
  ALTER TABLE "home_page" DROP COLUMN "bim_lead";
  ALTER TABLE "home_page" DROP COLUMN "bim_link_label";
  ALTER TABLE "home_page" DROP COLUMN "cta_title";
  ALTER TABLE "home_page" DROP COLUMN "cta_text";
  ALTER TABLE "home_page" DROP COLUMN "cta_link_label";
  ALTER TABLE "_home_page_v_version_hero_tasks" DROP COLUMN "label";
  ALTER TABLE "_home_page_v_version_hero_tasks" DROP COLUMN "question";
  ALTER TABLE "_home_page_v_version_side_cards" DROP COLUMN "title";
  ALTER TABLE "_home_page_v_version_side_cards" DROP COLUMN "text";
  ALTER TABLE "_home_page_v_version_side_cards" DROP COLUMN "link_label";
  ALTER TABLE "_home_page_v_version_trust_partners" DROP COLUMN "status";
  ALTER TABLE "_home_page_v_version_trust_partners" DROP COLUMN "note";
  ALTER TABLE "_home_page_v_version_trust_links" DROP COLUMN "label";
  ALTER TABLE "_home_page_v_version_popular_items" DROP COLUMN "title";
  ALTER TABLE "_home_page_v_version_bim_stages" DROP COLUMN "title";
  ALTER TABLE "_home_page_v_version_bim_stages" DROP COLUMN "text";
  ALTER TABLE "_home_page_v_version_bim_stats" DROP COLUMN "value";
  ALTER TABLE "_home_page_v_version_bim_stats" DROP COLUMN "label";
  ALTER TABLE "_home_page_v_version_process" DROP COLUMN "title";
  ALTER TABLE "_home_page_v_version_process" DROP COLUMN "text";
  ALTER TABLE "_home_page_v_version_faq" DROP COLUMN "question";
  ALTER TABLE "_home_page_v_version_faq" DROP COLUMN "answer";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_eyebrow";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_title";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_hero_lead";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_hero_card_title";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_hero_placeholder";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_hero_note";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_trust_title";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_trust_lead";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_popular_title";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_popular_lead";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_renew_title";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_renew_text";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_bim_eyebrow";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_bim_title";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_bim_lead";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_bim_link_label";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_cta_title";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_cta_text";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_cta_link_label";
  ALTER TABLE "site_settings_phones" DROP COLUMN "label";
  ALTER TABLE "site_settings_purchase_terms_software" DROP COLUMN "title";
  ALTER TABLE "site_settings_purchase_terms_software" DROP COLUMN "text";
  ALTER TABLE "site_settings_purchase_terms_hardware" DROP COLUMN "title";
  ALTER TABLE "site_settings_purchase_terms_hardware" DROP COLUMN "text";
  ALTER TABLE "site_settings" DROP COLUMN "address";
  ALTER TABLE "site_settings" DROP COLUMN "hours";
  ALTER TABLE "site_settings" DROP COLUMN "footer_text";
  ALTER TABLE "_site_settings_v_version_phones" DROP COLUMN "label";
  ALTER TABLE "_site_settings_v_version_purchase_terms_software" DROP COLUMN "title";
  ALTER TABLE "_site_settings_v_version_purchase_terms_software" DROP COLUMN "text";
  ALTER TABLE "_site_settings_v_version_purchase_terms_hardware" DROP COLUMN "title";
  ALTER TABLE "_site_settings_v_version_purchase_terms_hardware" DROP COLUMN "text";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_address";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_hours";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_footer_text";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  -- Возврат: колонки снова в основных таблицах, русский текст из таблиц переводов,
  -- казахский и английский теряются. NOT NULL — после заполнения, иначе не добавить.
  ALTER TABLE "products_tasks" ADD COLUMN "title" varchar;
  ALTER TABLE "products_faq" ADD COLUMN "question" varchar;
  ALTER TABLE "products_faq" ADD COLUMN "answer" varchar;
  ALTER TABLE "products" ADD COLUMN "title" varchar;
  ALTER TABLE "products" ADD COLUMN "summary" varchar;
  ALTER TABLE "products" ADD COLUMN "description" varchar;
  ALTER TABLE "products" ADD COLUMN "seo_title" varchar;
  ALTER TABLE "products" ADD COLUMN "seo_description" varchar;
  ALTER TABLE "_products_v_version_tasks" ADD COLUMN "title" varchar;
  ALTER TABLE "_products_v_version_faq" ADD COLUMN "question" varchar;
  ALTER TABLE "_products_v_version_faq" ADD COLUMN "answer" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_title" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_summary" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_description" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_seo_title" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_seo_description" varchar;
  ALTER TABLE "publications" ADD COLUMN "excerpt" varchar;
  ALTER TABLE "publications" ADD COLUMN "body" varchar;
  ALTER TABLE "publications" ADD COLUMN "seo_title" varchar;
  ALTER TABLE "publications" ADD COLUMN "seo_description" varchar;
  ALTER TABLE "_publications_v" ADD COLUMN "version_excerpt" varchar;
  ALTER TABLE "_publications_v" ADD COLUMN "version_body" varchar;
  ALTER TABLE "_publications_v" ADD COLUMN "version_seo_title" varchar;
  ALTER TABLE "_publications_v" ADD COLUMN "version_seo_description" varchar;
  ALTER TABLE "pages" ADD COLUMN "lead" varchar;
  ALTER TABLE "pages" ADD COLUMN "body" varchar;
  ALTER TABLE "pages" ADD COLUMN "seo_title" varchar;
  ALTER TABLE "pages" ADD COLUMN "seo_description" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_lead" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_body" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_seo_title" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_seo_description" varchar;
  ALTER TABLE "sections" ADD COLUMN "title" varchar;
  ALTER TABLE "sections" ADD COLUMN "summary" varchar;
  ALTER TABLE "_sections_v" ADD COLUMN "version_title" varchar;
  ALTER TABLE "_sections_v" ADD COLUMN "version_summary" varchar;
  ALTER TABLE "home_page_hero_tasks" ADD COLUMN "label" varchar;
  ALTER TABLE "home_page_hero_tasks" ADD COLUMN "question" varchar;
  ALTER TABLE "home_page_side_cards" ADD COLUMN "title" varchar;
  ALTER TABLE "home_page_side_cards" ADD COLUMN "text" varchar;
  ALTER TABLE "home_page_side_cards" ADD COLUMN "link_label" varchar;
  ALTER TABLE "home_page_trust_partners" ADD COLUMN "status" varchar;
  ALTER TABLE "home_page_trust_partners" ADD COLUMN "note" varchar;
  ALTER TABLE "home_page_trust_links" ADD COLUMN "label" varchar;
  ALTER TABLE "home_page_popular_items" ADD COLUMN "title" varchar;
  ALTER TABLE "home_page_bim_stages" ADD COLUMN "title" varchar;
  ALTER TABLE "home_page_bim_stages" ADD COLUMN "text" varchar;
  ALTER TABLE "home_page_bim_stats" ADD COLUMN "value" varchar;
  ALTER TABLE "home_page_bim_stats" ADD COLUMN "label" varchar;
  ALTER TABLE "home_page_process" ADD COLUMN "title" varchar;
  ALTER TABLE "home_page_process" ADD COLUMN "text" varchar;
  ALTER TABLE "home_page_faq" ADD COLUMN "question" varchar;
  ALTER TABLE "home_page_faq" ADD COLUMN "answer" varchar;
  ALTER TABLE "home_page" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "home_page" ADD COLUMN "title" varchar;
  ALTER TABLE "home_page" ADD COLUMN "hero_lead" varchar;
  ALTER TABLE "home_page" ADD COLUMN "hero_card_title" varchar;
  ALTER TABLE "home_page" ADD COLUMN "hero_placeholder" varchar;
  ALTER TABLE "home_page" ADD COLUMN "hero_note" varchar;
  ALTER TABLE "home_page" ADD COLUMN "trust_title" varchar;
  ALTER TABLE "home_page" ADD COLUMN "trust_lead" varchar;
  ALTER TABLE "home_page" ADD COLUMN "popular_title" varchar;
  ALTER TABLE "home_page" ADD COLUMN "popular_lead" varchar;
  ALTER TABLE "home_page" ADD COLUMN "renew_title" varchar;
  ALTER TABLE "home_page" ADD COLUMN "renew_text" varchar;
  ALTER TABLE "home_page" ADD COLUMN "bim_eyebrow" varchar;
  ALTER TABLE "home_page" ADD COLUMN "bim_title" varchar;
  ALTER TABLE "home_page" ADD COLUMN "bim_lead" varchar;
  ALTER TABLE "home_page" ADD COLUMN "bim_link_label" varchar;
  ALTER TABLE "home_page" ADD COLUMN "cta_title" varchar;
  ALTER TABLE "home_page" ADD COLUMN "cta_text" varchar;
  ALTER TABLE "home_page" ADD COLUMN "cta_link_label" varchar;
  ALTER TABLE "_home_page_v_version_hero_tasks" ADD COLUMN "label" varchar;
  ALTER TABLE "_home_page_v_version_hero_tasks" ADD COLUMN "question" varchar;
  ALTER TABLE "_home_page_v_version_side_cards" ADD COLUMN "title" varchar;
  ALTER TABLE "_home_page_v_version_side_cards" ADD COLUMN "text" varchar;
  ALTER TABLE "_home_page_v_version_side_cards" ADD COLUMN "link_label" varchar;
  ALTER TABLE "_home_page_v_version_trust_partners" ADD COLUMN "status" varchar;
  ALTER TABLE "_home_page_v_version_trust_partners" ADD COLUMN "note" varchar;
  ALTER TABLE "_home_page_v_version_trust_links" ADD COLUMN "label" varchar;
  ALTER TABLE "_home_page_v_version_popular_items" ADD COLUMN "title" varchar;
  ALTER TABLE "_home_page_v_version_bim_stages" ADD COLUMN "title" varchar;
  ALTER TABLE "_home_page_v_version_bim_stages" ADD COLUMN "text" varchar;
  ALTER TABLE "_home_page_v_version_bim_stats" ADD COLUMN "value" varchar;
  ALTER TABLE "_home_page_v_version_bim_stats" ADD COLUMN "label" varchar;
  ALTER TABLE "_home_page_v_version_process" ADD COLUMN "title" varchar;
  ALTER TABLE "_home_page_v_version_process" ADD COLUMN "text" varchar;
  ALTER TABLE "_home_page_v_version_faq" ADD COLUMN "question" varchar;
  ALTER TABLE "_home_page_v_version_faq" ADD COLUMN "answer" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_eyebrow" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_title" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_hero_lead" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_hero_card_title" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_hero_placeholder" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_hero_note" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_trust_title" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_trust_lead" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_popular_title" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_popular_lead" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_renew_title" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_renew_text" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_bim_eyebrow" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_bim_title" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_bim_lead" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_bim_link_label" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_cta_title" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_cta_text" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_cta_link_label" varchar;
  ALTER TABLE "site_settings_phones" ADD COLUMN "label" varchar;
  ALTER TABLE "site_settings_purchase_terms_software" ADD COLUMN "title" varchar;
  ALTER TABLE "site_settings_purchase_terms_software" ADD COLUMN "text" varchar;
  ALTER TABLE "site_settings_purchase_terms_hardware" ADD COLUMN "title" varchar;
  ALTER TABLE "site_settings_purchase_terms_hardware" ADD COLUMN "text" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "address" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "hours" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "footer_text" varchar;
  ALTER TABLE "_site_settings_v_version_phones" ADD COLUMN "label" varchar;
  ALTER TABLE "_site_settings_v_version_purchase_terms_software" ADD COLUMN "title" varchar;
  ALTER TABLE "_site_settings_v_version_purchase_terms_software" ADD COLUMN "text" varchar;
  ALTER TABLE "_site_settings_v_version_purchase_terms_hardware" ADD COLUMN "title" varchar;
  ALTER TABLE "_site_settings_v_version_purchase_terms_hardware" ADD COLUMN "text" varchar;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_address" varchar;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_hours" varchar;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_footer_text" varchar;
  UPDATE "products_tasks" SET "title" = l."title"
    FROM "products_tasks_locales" l WHERE l."_parent_id" = "products_tasks"."id" AND l."_locale" = 'ru';
  UPDATE "products_faq" SET "question" = l."question", "answer" = l."answer"
    FROM "products_faq_locales" l WHERE l."_parent_id" = "products_faq"."id" AND l."_locale" = 'ru';
  UPDATE "products" SET "title" = l."title", "summary" = l."summary", "description" = l."description", "seo_title" = l."seo_title", "seo_description" = l."seo_description"
    FROM "products_locales" l WHERE l."_parent_id" = "products"."id" AND l."_locale" = 'ru';
  UPDATE "_products_v_version_tasks" SET "title" = l."title"
    FROM "_products_v_version_tasks_locales" l WHERE l."_parent_id" = "_products_v_version_tasks"."id" AND l."_locale" = 'ru';
  UPDATE "_products_v_version_faq" SET "question" = l."question", "answer" = l."answer"
    FROM "_products_v_version_faq_locales" l WHERE l."_parent_id" = "_products_v_version_faq"."id" AND l."_locale" = 'ru';
  UPDATE "_products_v" SET "version_title" = l."version_title", "version_summary" = l."version_summary", "version_description" = l."version_description", "version_seo_title" = l."version_seo_title", "version_seo_description" = l."version_seo_description"
    FROM "_products_v_locales" l WHERE l."_parent_id" = "_products_v"."id" AND l."_locale" = 'ru';
  UPDATE "publications" SET "excerpt" = l."excerpt", "body" = l."body", "seo_title" = l."seo_title", "seo_description" = l."seo_description"
    FROM "publications_locales" l WHERE l."_parent_id" = "publications"."id" AND l."_locale" = 'ru';
  UPDATE "_publications_v" SET "version_excerpt" = l."version_excerpt", "version_body" = l."version_body", "version_seo_title" = l."version_seo_title", "version_seo_description" = l."version_seo_description"
    FROM "_publications_v_locales" l WHERE l."_parent_id" = "_publications_v"."id" AND l."_locale" = 'ru';
  UPDATE "pages" SET "lead" = l."lead", "body" = l."body", "seo_title" = l."seo_title", "seo_description" = l."seo_description"
    FROM "pages_locales" l WHERE l."_parent_id" = "pages"."id" AND l."_locale" = 'ru';
  UPDATE "_pages_v" SET "version_lead" = l."version_lead", "version_body" = l."version_body", "version_seo_title" = l."version_seo_title", "version_seo_description" = l."version_seo_description"
    FROM "_pages_v_locales" l WHERE l."_parent_id" = "_pages_v"."id" AND l."_locale" = 'ru';
  UPDATE "sections" SET "title" = l."title", "summary" = l."summary"
    FROM "sections_locales" l WHERE l."_parent_id" = "sections"."id" AND l."_locale" = 'ru';
  UPDATE "_sections_v" SET "version_title" = l."version_title", "version_summary" = l."version_summary"
    FROM "_sections_v_locales" l WHERE l."_parent_id" = "_sections_v"."id" AND l."_locale" = 'ru';
  UPDATE "home_page_hero_tasks" SET "label" = l."label", "question" = l."question"
    FROM "home_page_hero_tasks_locales" l WHERE l."_parent_id" = "home_page_hero_tasks"."id" AND l."_locale" = 'ru';
  UPDATE "home_page_side_cards" SET "title" = l."title", "text" = l."text", "link_label" = l."link_label"
    FROM "home_page_side_cards_locales" l WHERE l."_parent_id" = "home_page_side_cards"."id" AND l."_locale" = 'ru';
  UPDATE "home_page_trust_partners" SET "status" = l."status", "note" = l."note"
    FROM "home_page_trust_partners_locales" l WHERE l."_parent_id" = "home_page_trust_partners"."id" AND l."_locale" = 'ru';
  UPDATE "home_page_trust_links" SET "label" = l."label"
    FROM "home_page_trust_links_locales" l WHERE l."_parent_id" = "home_page_trust_links"."id" AND l."_locale" = 'ru';
  UPDATE "home_page_popular_items" SET "title" = l."title"
    FROM "home_page_popular_items_locales" l WHERE l."_parent_id" = "home_page_popular_items"."id" AND l."_locale" = 'ru';
  UPDATE "home_page_bim_stages" SET "title" = l."title", "text" = l."text"
    FROM "home_page_bim_stages_locales" l WHERE l."_parent_id" = "home_page_bim_stages"."id" AND l."_locale" = 'ru';
  UPDATE "home_page_bim_stats" SET "value" = l."value", "label" = l."label"
    FROM "home_page_bim_stats_locales" l WHERE l."_parent_id" = "home_page_bim_stats"."id" AND l."_locale" = 'ru';
  UPDATE "home_page_process" SET "title" = l."title", "text" = l."text"
    FROM "home_page_process_locales" l WHERE l."_parent_id" = "home_page_process"."id" AND l."_locale" = 'ru';
  UPDATE "home_page_faq" SET "question" = l."question", "answer" = l."answer"
    FROM "home_page_faq_locales" l WHERE l."_parent_id" = "home_page_faq"."id" AND l."_locale" = 'ru';
  UPDATE "home_page" SET "eyebrow" = l."eyebrow", "title" = l."title", "hero_lead" = l."hero_lead", "hero_card_title" = l."hero_card_title", "hero_placeholder" = l."hero_placeholder", "hero_note" = l."hero_note", "trust_title" = l."trust_title", "trust_lead" = l."trust_lead", "popular_title" = l."popular_title", "popular_lead" = l."popular_lead", "renew_title" = l."renew_title", "renew_text" = l."renew_text", "bim_eyebrow" = l."bim_eyebrow", "bim_title" = l."bim_title", "bim_lead" = l."bim_lead", "bim_link_label" = l."bim_link_label", "cta_title" = l."cta_title", "cta_text" = l."cta_text", "cta_link_label" = l."cta_link_label"
    FROM "home_page_locales" l WHERE l."_parent_id" = "home_page"."id" AND l."_locale" = 'ru';
  UPDATE "_home_page_v_version_hero_tasks" SET "label" = l."label", "question" = l."question"
    FROM "_home_page_v_version_hero_tasks_locales" l WHERE l."_parent_id" = "_home_page_v_version_hero_tasks"."id" AND l."_locale" = 'ru';
  UPDATE "_home_page_v_version_side_cards" SET "title" = l."title", "text" = l."text", "link_label" = l."link_label"
    FROM "_home_page_v_version_side_cards_locales" l WHERE l."_parent_id" = "_home_page_v_version_side_cards"."id" AND l."_locale" = 'ru';
  UPDATE "_home_page_v_version_trust_partners" SET "status" = l."status", "note" = l."note"
    FROM "_home_page_v_version_trust_partners_locales" l WHERE l."_parent_id" = "_home_page_v_version_trust_partners"."id" AND l."_locale" = 'ru';
  UPDATE "_home_page_v_version_trust_links" SET "label" = l."label"
    FROM "_home_page_v_version_trust_links_locales" l WHERE l."_parent_id" = "_home_page_v_version_trust_links"."id" AND l."_locale" = 'ru';
  UPDATE "_home_page_v_version_popular_items" SET "title" = l."title"
    FROM "_home_page_v_version_popular_items_locales" l WHERE l."_parent_id" = "_home_page_v_version_popular_items"."id" AND l."_locale" = 'ru';
  UPDATE "_home_page_v_version_bim_stages" SET "title" = l."title", "text" = l."text"
    FROM "_home_page_v_version_bim_stages_locales" l WHERE l."_parent_id" = "_home_page_v_version_bim_stages"."id" AND l."_locale" = 'ru';
  UPDATE "_home_page_v_version_bim_stats" SET "value" = l."value", "label" = l."label"
    FROM "_home_page_v_version_bim_stats_locales" l WHERE l."_parent_id" = "_home_page_v_version_bim_stats"."id" AND l."_locale" = 'ru';
  UPDATE "_home_page_v_version_process" SET "title" = l."title", "text" = l."text"
    FROM "_home_page_v_version_process_locales" l WHERE l."_parent_id" = "_home_page_v_version_process"."id" AND l."_locale" = 'ru';
  UPDATE "_home_page_v_version_faq" SET "question" = l."question", "answer" = l."answer"
    FROM "_home_page_v_version_faq_locales" l WHERE l."_parent_id" = "_home_page_v_version_faq"."id" AND l."_locale" = 'ru';
  UPDATE "_home_page_v" SET "version_eyebrow" = l."version_eyebrow", "version_title" = l."version_title", "version_hero_lead" = l."version_hero_lead", "version_hero_card_title" = l."version_hero_card_title", "version_hero_placeholder" = l."version_hero_placeholder", "version_hero_note" = l."version_hero_note", "version_trust_title" = l."version_trust_title", "version_trust_lead" = l."version_trust_lead", "version_popular_title" = l."version_popular_title", "version_popular_lead" = l."version_popular_lead", "version_renew_title" = l."version_renew_title", "version_renew_text" = l."version_renew_text", "version_bim_eyebrow" = l."version_bim_eyebrow", "version_bim_title" = l."version_bim_title", "version_bim_lead" = l."version_bim_lead", "version_bim_link_label" = l."version_bim_link_label", "version_cta_title" = l."version_cta_title", "version_cta_text" = l."version_cta_text", "version_cta_link_label" = l."version_cta_link_label"
    FROM "_home_page_v_locales" l WHERE l."_parent_id" = "_home_page_v"."id" AND l."_locale" = 'ru';
  UPDATE "site_settings_phones" SET "label" = l."label"
    FROM "site_settings_phones_locales" l WHERE l."_parent_id" = "site_settings_phones"."id" AND l."_locale" = 'ru';
  UPDATE "site_settings_purchase_terms_software" SET "title" = l."title", "text" = l."text"
    FROM "site_settings_purchase_terms_software_locales" l WHERE l."_parent_id" = "site_settings_purchase_terms_software"."id" AND l."_locale" = 'ru';
  UPDATE "site_settings_purchase_terms_hardware" SET "title" = l."title", "text" = l."text"
    FROM "site_settings_purchase_terms_hardware_locales" l WHERE l."_parent_id" = "site_settings_purchase_terms_hardware"."id" AND l."_locale" = 'ru';
  UPDATE "site_settings" SET "address" = l."address", "hours" = l."hours", "footer_text" = l."footer_text"
    FROM "site_settings_locales" l WHERE l."_parent_id" = "site_settings"."id" AND l."_locale" = 'ru';
  UPDATE "_site_settings_v_version_phones" SET "label" = l."label"
    FROM "_site_settings_v_version_phones_locales" l WHERE l."_parent_id" = "_site_settings_v_version_phones"."id" AND l."_locale" = 'ru';
  UPDATE "_site_settings_v_version_purchase_terms_software" SET "title" = l."title", "text" = l."text"
    FROM "_site_settings_v_version_purchase_terms_software_locales" l WHERE l."_parent_id" = "_site_settings_v_version_purchase_terms_software"."id" AND l."_locale" = 'ru';
  UPDATE "_site_settings_v_version_purchase_terms_hardware" SET "title" = l."title", "text" = l."text"
    FROM "_site_settings_v_version_purchase_terms_hardware_locales" l WHERE l."_parent_id" = "_site_settings_v_version_purchase_terms_hardware"."id" AND l."_locale" = 'ru';
  UPDATE "_site_settings_v" SET "version_address" = l."version_address", "version_hours" = l."version_hours", "version_footer_text" = l."version_footer_text"
    FROM "_site_settings_v_locales" l WHERE l."_parent_id" = "_site_settings_v"."id" AND l."_locale" = 'ru';
  ALTER TABLE "products_tasks" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "products_faq" ALTER COLUMN "question" SET NOT NULL;
  ALTER TABLE "products_faq" ALTER COLUMN "answer" SET NOT NULL;
  ALTER TABLE "products" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "_products_v_version_tasks" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "_products_v_version_faq" ALTER COLUMN "question" SET NOT NULL;
  ALTER TABLE "_products_v_version_faq" ALTER COLUMN "answer" SET NOT NULL;
  ALTER TABLE "_products_v" ALTER COLUMN "version_title" SET NOT NULL;
  ALTER TABLE "sections" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "_sections_v" ALTER COLUMN "version_title" SET NOT NULL;
  ALTER TABLE "home_page_hero_tasks" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "home_page_hero_tasks" ALTER COLUMN "question" SET NOT NULL;
  ALTER TABLE "home_page_side_cards" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "home_page_trust_links" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "home_page_bim_stages" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "home_page_bim_stats" ALTER COLUMN "value" SET NOT NULL;
  ALTER TABLE "home_page_bim_stats" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "home_page_process" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "home_page_faq" ALTER COLUMN "question" SET NOT NULL;
  ALTER TABLE "home_page_faq" ALTER COLUMN "answer" SET NOT NULL;
  ALTER TABLE "home_page" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "_home_page_v_version_hero_tasks" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "_home_page_v_version_hero_tasks" ALTER COLUMN "question" SET NOT NULL;
  ALTER TABLE "_home_page_v_version_side_cards" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "_home_page_v_version_trust_links" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "_home_page_v_version_bim_stages" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "_home_page_v_version_bim_stats" ALTER COLUMN "value" SET NOT NULL;
  ALTER TABLE "_home_page_v_version_bim_stats" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "_home_page_v_version_process" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "_home_page_v_version_faq" ALTER COLUMN "question" SET NOT NULL;
  ALTER TABLE "_home_page_v_version_faq" ALTER COLUMN "answer" SET NOT NULL;
  ALTER TABLE "_home_page_v" ALTER COLUMN "version_title" SET NOT NULL;
  ALTER TABLE "site_settings_phones" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "site_settings_purchase_terms_software" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "site_settings_purchase_terms_software" ALTER COLUMN "text" SET NOT NULL;
  ALTER TABLE "site_settings_purchase_terms_hardware" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "site_settings_purchase_terms_hardware" ALTER COLUMN "text" SET NOT NULL;
  ALTER TABLE "_site_settings_v_version_phones" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "_site_settings_v_version_purchase_terms_software" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "_site_settings_v_version_purchase_terms_software" ALTER COLUMN "text" SET NOT NULL;
  ALTER TABLE "_site_settings_v_version_purchase_terms_hardware" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "_site_settings_v_version_purchase_terms_hardware" ALTER COLUMN "text" SET NOT NULL;
  DROP TABLE "products_tasks_locales" CASCADE;
  DROP TABLE "products_faq_locales" CASCADE;
  DROP TABLE "products_locales" CASCADE;
  DROP TABLE "_products_v_version_tasks_locales" CASCADE;
  DROP TABLE "_products_v_version_faq_locales" CASCADE;
  DROP TABLE "_products_v_locales" CASCADE;
  DROP TABLE "publications_locales" CASCADE;
  DROP TABLE "_publications_v_locales" CASCADE;
  DROP TABLE "pages_locales" CASCADE;
  DROP TABLE "_pages_v_locales" CASCADE;
  DROP TABLE "sections_locales" CASCADE;
  DROP TABLE "_sections_v_locales" CASCADE;
  DROP TABLE "home_page_hero_tasks_locales" CASCADE;
  DROP TABLE "home_page_side_cards_locales" CASCADE;
  DROP TABLE "home_page_trust_partners_locales" CASCADE;
  DROP TABLE "home_page_trust_links_locales" CASCADE;
  DROP TABLE "home_page_popular_items_locales" CASCADE;
  DROP TABLE "home_page_bim_stages_locales" CASCADE;
  DROP TABLE "home_page_bim_stats_locales" CASCADE;
  DROP TABLE "home_page_process_locales" CASCADE;
  DROP TABLE "home_page_faq_locales" CASCADE;
  DROP TABLE "home_page_locales" CASCADE;
  DROP TABLE "_home_page_v_version_hero_tasks_locales" CASCADE;
  DROP TABLE "_home_page_v_version_side_cards_locales" CASCADE;
  DROP TABLE "_home_page_v_version_trust_partners_locales" CASCADE;
  DROP TABLE "_home_page_v_version_trust_links_locales" CASCADE;
  DROP TABLE "_home_page_v_version_popular_items_locales" CASCADE;
  DROP TABLE "_home_page_v_version_bim_stages_locales" CASCADE;
  DROP TABLE "_home_page_v_version_bim_stats_locales" CASCADE;
  DROP TABLE "_home_page_v_version_process_locales" CASCADE;
  DROP TABLE "_home_page_v_version_faq_locales" CASCADE;
  DROP TABLE "_home_page_v_locales" CASCADE;
  DROP TABLE "site_settings_phones_locales" CASCADE;
  DROP TABLE "site_settings_purchase_terms_software_locales" CASCADE;
  DROP TABLE "site_settings_purchase_terms_hardware_locales" CASCADE;
  DROP TABLE "site_settings_locales" CASCADE;
  DROP TABLE "_site_settings_v_version_phones_locales" CASCADE;
  DROP TABLE "_site_settings_v_version_purchase_terms_software_locales" CASCADE;
  DROP TABLE "_site_settings_v_version_purchase_terms_hardware_locales" CASCADE;
  DROP TABLE "_site_settings_v_locales" CASCADE;
  DROP TYPE "public"."_locales";`)
}
