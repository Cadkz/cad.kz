import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_picker_steps_mode" AS ENUM('base', 'one', 'many', 'bundle');
  CREATE TYPE "public"."enum_products_page_view" AS ENUM('standard', 'picker', 'none');
  CREATE TYPE "public"."enum_site_requests_kind" AS ENUM('price', 'renew', 'help', 'quote');
  CREATE TYPE "public"."enum_site_requests_mode" AS ENUM('demo', 'live');
  CREATE TABLE "products_picker_switches_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"note" varchar
  );
  
  CREATE TABLE "products_picker_switches" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar
  );
  
  CREATE TABLE "products_picker_steps_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_id" integer,
  	"offer_id" integer,
  	"label" varchar,
  	"note" varchar,
  	"preselect" boolean
  );
  
  CREATE TABLE "products_picker_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"mode" "enum_products_picker_steps_mode" DEFAULT 'one',
  	"hint" varchar,
  	"collapsed" boolean
  );
  
  CREATE TABLE "site_requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"number" varchar NOT NULL,
  	"kind" "enum_site_requests_kind" NOT NULL,
  	"mode" "enum_site_requests_mode" NOT NULL,
  	"product_title" varchar NOT NULL,
  	"page" varchar,
  	"contact_name" varchar NOT NULL,
  	"contact_phone" varchar NOT NULL,
  	"comment" varchar,
  	"items" jsonb NOT NULL,
  	"total_kzt" varchar,
  	"consent_accepted" boolean,
  	"consent_at" timestamp(3) with time zone,
  	"consent_version" varchar,
  	"consent_text" varchar,
  	"idempotency_key" varchar NOT NULL,
  	"client_hash" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "products" ADD COLUMN "page_view" "enum_products_page_view" DEFAULT 'standard' NOT NULL;
  ALTER TABLE "products" ADD COLUMN "renew_label" varchar;
  ALTER TABLE "product_lines" ADD COLUMN "family_page" boolean;
  ALTER TABLE "product_lines" ADD COLUMN "slug" varchar;
  ALTER TABLE "product_lines" ADD COLUMN "intro" varchar;
  ALTER TABLE "product_lines" ADD COLUMN "seo_title" varchar;
  ALTER TABLE "product_lines" ADD COLUMN "seo_description" varchar;
  ALTER TABLE "crm_deliveries" ADD COLUMN "request_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "site_requests_id" integer;
  ALTER TABLE "products_picker_switches_options" ADD CONSTRAINT "products_picker_switches_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products_picker_switches"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_picker_switches" ADD CONSTRAINT "products_picker_switches_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_picker_steps_items" ADD CONSTRAINT "products_picker_steps_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_picker_steps_items" ADD CONSTRAINT "products_picker_steps_items_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_picker_steps_items" ADD CONSTRAINT "products_picker_steps_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products_picker_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_picker_steps" ADD CONSTRAINT "products_picker_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_picker_switches_options_order_idx" ON "products_picker_switches_options" USING btree ("_order");
  CREATE INDEX "products_picker_switches_options_parent_id_idx" ON "products_picker_switches_options" USING btree ("_parent_id");
  CREATE INDEX "products_picker_switches_order_idx" ON "products_picker_switches" USING btree ("_order");
  CREATE INDEX "products_picker_switches_parent_id_idx" ON "products_picker_switches" USING btree ("_parent_id");
  CREATE INDEX "products_picker_steps_items_order_idx" ON "products_picker_steps_items" USING btree ("_order");
  CREATE INDEX "products_picker_steps_items_parent_id_idx" ON "products_picker_steps_items" USING btree ("_parent_id");
  CREATE INDEX "products_picker_steps_items_product_idx" ON "products_picker_steps_items" USING btree ("product_id");
  CREATE INDEX "products_picker_steps_items_offer_idx" ON "products_picker_steps_items" USING btree ("offer_id");
  CREATE INDEX "products_picker_steps_order_idx" ON "products_picker_steps" USING btree ("_order");
  CREATE INDEX "products_picker_steps_parent_id_idx" ON "products_picker_steps" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_requests_number_idx" ON "site_requests" USING btree ("number");
  CREATE UNIQUE INDEX "site_requests_idempotency_key_idx" ON "site_requests" USING btree ("idempotency_key");
  CREATE INDEX "site_requests_updated_at_idx" ON "site_requests" USING btree ("updated_at");
  CREATE INDEX "site_requests_created_at_idx" ON "site_requests" USING btree ("created_at");
  ALTER TABLE "crm_deliveries" ADD CONSTRAINT "crm_deliveries_request_id_site_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."site_requests"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_site_requests_fk" FOREIGN KEY ("site_requests_id") REFERENCES "public"."site_requests"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "product_lines_slug_idx" ON "product_lines" USING btree ("slug");
  CREATE INDEX "crm_deliveries_request_idx" ON "crm_deliveries" USING btree ("request_id");
  CREATE INDEX "payload_locked_documents_rels_site_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("site_requests_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products_picker_switches_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_picker_switches" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_picker_steps_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_picker_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_requests" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "products_picker_switches_options" CASCADE;
  DROP TABLE "products_picker_switches" CASCADE;
  DROP TABLE "products_picker_steps_items" CASCADE;
  DROP TABLE "products_picker_steps" CASCADE;
  DROP TABLE "site_requests" CASCADE;
  ALTER TABLE "crm_deliveries" DROP CONSTRAINT "crm_deliveries_request_id_site_requests_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_site_requests_fk";
  
  DROP INDEX "product_lines_slug_idx";
  DROP INDEX "crm_deliveries_request_idx";
  DROP INDEX "payload_locked_documents_rels_site_requests_id_idx";
  ALTER TABLE "products" DROP COLUMN "page_view";
  ALTER TABLE "products" DROP COLUMN "renew_label";
  ALTER TABLE "product_lines" DROP COLUMN "family_page";
  ALTER TABLE "product_lines" DROP COLUMN "slug";
  ALTER TABLE "product_lines" DROP COLUMN "intro";
  ALTER TABLE "product_lines" DROP COLUMN "seo_title";
  ALTER TABLE "product_lines" DROP COLUMN "seo_description";
  ALTER TABLE "crm_deliveries" DROP COLUMN "request_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "site_requests_id";
  DROP TYPE "public"."enum_products_picker_steps_mode";
  DROP TYPE "public"."enum_products_page_view";
  DROP TYPE "public"."enum_site_requests_kind";
  DROP TYPE "public"."enum_site_requests_mode";`)
}
