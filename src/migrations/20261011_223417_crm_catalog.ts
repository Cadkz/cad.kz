import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_scenario" AS ENUM('standard', 'corporate', 'equipment', 'renewal', 'service');
  CREATE TYPE "public"."enum_sections_scenario" AS ENUM('standard', 'corporate', 'equipment', 'renewal', 'service');
  ALTER TYPE "public"."enum_sections_icon" ADD VALUE 'compass';
  ALTER TYPE "public"."enum_site_requests_kind" ADD VALUE 'demo';
  ALTER TYPE "public"."enum_site_requests_kind" ADD VALUE 'consult';
  ALTER TYPE "public"."enum_site_requests_kind" ADD VALUE 'signup';
  CREATE TABLE "home_page_popular_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_id" integer,
  	"title" varchar,
  	"text" varchar,
  	"href" varchar,
  	"button_label" varchar
  );
  
  ALTER TABLE "products" ADD COLUMN "scenario" "enum_products_scenario";
  ALTER TABLE "sections" ADD COLUMN "scenario" "enum_sections_scenario";
  ALTER TABLE "sections" ADD COLUMN "demo_button" boolean;
  ALTER TABLE "site_requests" ADD COLUMN "button" varchar;
  ALTER TABLE "site_requests" ADD COLUMN "section_title" varchar;
  ALTER TABLE "site_requests" ADD COLUMN "scenario" varchar;
  ALTER TABLE "home_page" ADD COLUMN "popular_title" varchar;
  ALTER TABLE "home_page" ADD COLUMN "popular_lead" varchar;
  ALTER TABLE "home_page" ADD COLUMN "renew_title" varchar;
  ALTER TABLE "home_page" ADD COLUMN "renew_text" varchar;
  ALTER TABLE "home_page_popular_items" ADD CONSTRAINT "home_page_popular_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page_popular_items" ADD CONSTRAINT "home_page_popular_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "home_page_popular_items_order_idx" ON "home_page_popular_items" USING btree ("_order");
  CREATE INDEX "home_page_popular_items_parent_id_idx" ON "home_page_popular_items" USING btree ("_parent_id");
  CREATE INDEX "home_page_popular_items_product_idx" ON "home_page_popular_items" USING btree ("product_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "home_page_popular_items" CASCADE;
  ALTER TABLE "sections" ALTER COLUMN "icon" SET DATA TYPE text;
  ALTER TABLE "sections" ALTER COLUMN "icon" SET DEFAULT 'building'::text;
  DROP TYPE "public"."enum_sections_icon";
  CREATE TYPE "public"."enum_sections_icon" AS ENUM('building', 'columns', 'layers', 'route', 'wrench', 'droplet', 'cog', 'image', 'file', 'scan', 'printer', 'monitor', 'graduation');
  ALTER TABLE "sections" ALTER COLUMN "icon" SET DEFAULT 'building'::"public"."enum_sections_icon";
  ALTER TABLE "sections" ALTER COLUMN "icon" SET DATA TYPE "public"."enum_sections_icon" USING "icon"::"public"."enum_sections_icon";
  ALTER TABLE "site_requests" ALTER COLUMN "kind" SET DATA TYPE text;
  DROP TYPE "public"."enum_site_requests_kind";
  CREATE TYPE "public"."enum_site_requests_kind" AS ENUM('price', 'renew', 'help', 'quote');
  ALTER TABLE "site_requests" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_site_requests_kind" USING "kind"::"public"."enum_site_requests_kind";
  ALTER TABLE "products" DROP COLUMN "scenario";
  ALTER TABLE "sections" DROP COLUMN "scenario";
  ALTER TABLE "sections" DROP COLUMN "demo_button";
  ALTER TABLE "site_requests" DROP COLUMN "button";
  ALTER TABLE "site_requests" DROP COLUMN "section_title";
  ALTER TABLE "site_requests" DROP COLUMN "scenario";
  ALTER TABLE "home_page" DROP COLUMN "popular_title";
  ALTER TABLE "home_page" DROP COLUMN "popular_lead";
  ALTER TABLE "home_page" DROP COLUMN "renew_title";
  ALTER TABLE "home_page" DROP COLUMN "renew_text";
  DROP TYPE "public"."enum_products_scenario";
  DROP TYPE "public"."enum_sections_scenario";`)
}
