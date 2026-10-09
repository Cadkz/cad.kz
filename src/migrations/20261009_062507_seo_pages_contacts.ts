import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"status" "enum_pages_status" DEFAULT 'draft' NOT NULL,
  	"slug" varchar NOT NULL,
  	"lead" varchar,
  	"body" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"legacy_key" varchar,
  	"legacy_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "products" ADD COLUMN "seo_title" varchar;
  ALTER TABLE "products" ADD COLUMN "seo_description" varchar;
  ALTER TABLE "publications" ADD COLUMN "seo_title" varchar;
  ALTER TABLE "publications" ADD COLUMN "seo_description" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "pages_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "address" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "hours" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "map_url" varchar;
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE UNIQUE INDEX "pages_legacy_key_idx" ON "pages" USING btree ("legacy_key");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_pages_fk";
  
  DROP INDEX "payload_locked_documents_rels_pages_id_idx";
  ALTER TABLE "products" DROP COLUMN "seo_title";
  ALTER TABLE "products" DROP COLUMN "seo_description";
  ALTER TABLE "publications" DROP COLUMN "seo_title";
  ALTER TABLE "publications" DROP COLUMN "seo_description";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "pages_id";
  ALTER TABLE "site_settings" DROP COLUMN "address";
  ALTER TABLE "site_settings" DROP COLUMN "hours";
  ALTER TABLE "site_settings" DROP COLUMN "map_url";
  DROP TYPE "public"."enum_pages_status";`)
}
