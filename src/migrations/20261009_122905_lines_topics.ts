import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_product_lines_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_topics_status" AS ENUM('draft', 'published');
  CREATE TABLE "product_lines" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"status" "enum_product_lines_status" DEFAULT 'draft' NOT NULL,
  	"manufacturer_id" integer NOT NULL,
  	"order" numeric DEFAULT 100,
  	"summary" varchar,
  	"legacy_key" varchar,
  	"legacy_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "topics" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"status" "enum_topics_status" DEFAULT 'draft' NOT NULL,
  	"slug" varchar NOT NULL,
  	"order" numeric DEFAULT 100,
  	"legacy_key" varchar,
  	"legacy_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "products" ADD COLUMN "line_id" integer;
  ALTER TABLE "products" ADD COLUMN "line_order" numeric;
  ALTER TABLE "publications" ADD COLUMN "theme_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "product_lines_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "topics_id" integer;
  ALTER TABLE "product_lines" ADD CONSTRAINT "product_lines_manufacturer_id_manufacturers_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "product_lines_manufacturer_idx" ON "product_lines" USING btree ("manufacturer_id");
  CREATE UNIQUE INDEX "product_lines_legacy_key_idx" ON "product_lines" USING btree ("legacy_key");
  CREATE INDEX "product_lines_updated_at_idx" ON "product_lines" USING btree ("updated_at");
  CREATE INDEX "product_lines_created_at_idx" ON "product_lines" USING btree ("created_at");
  CREATE UNIQUE INDEX "topics_slug_idx" ON "topics" USING btree ("slug");
  CREATE UNIQUE INDEX "topics_legacy_key_idx" ON "topics" USING btree ("legacy_key");
  CREATE INDEX "topics_updated_at_idx" ON "topics" USING btree ("updated_at");
  CREATE INDEX "topics_created_at_idx" ON "topics" USING btree ("created_at");
  ALTER TABLE "products" ADD CONSTRAINT "products_line_id_product_lines_id_fk" FOREIGN KEY ("line_id") REFERENCES "public"."product_lines"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "publications" ADD CONSTRAINT "publications_theme_id_topics_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_product_lines_fk" FOREIGN KEY ("product_lines_id") REFERENCES "public"."product_lines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_topics_fk" FOREIGN KEY ("topics_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_line_idx" ON "products" USING btree ("line_id");
  CREATE INDEX "publications_theme_idx" ON "publications" USING btree ("theme_id");
  CREATE INDEX "payload_locked_documents_rels_product_lines_id_idx" ON "payload_locked_documents_rels" USING btree ("product_lines_id");
  CREATE INDEX "payload_locked_documents_rels_topics_id_idx" ON "payload_locked_documents_rels" USING btree ("topics_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "product_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "topics" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "product_lines" CASCADE;
  DROP TABLE "topics" CASCADE;
  ALTER TABLE "products" DROP CONSTRAINT "products_line_id_product_lines_id_fk";
  
  ALTER TABLE "publications" DROP CONSTRAINT "publications_theme_id_topics_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_product_lines_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_topics_fk";
  
  DROP INDEX "products_line_idx";
  DROP INDEX "publications_theme_idx";
  DROP INDEX "payload_locked_documents_rels_product_lines_id_idx";
  DROP INDEX "payload_locked_documents_rels_topics_id_idx";
  ALTER TABLE "products" DROP COLUMN "line_id";
  ALTER TABLE "products" DROP COLUMN "line_order";
  ALTER TABLE "publications" DROP COLUMN "theme_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "product_lines_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "topics_id";
  DROP TYPE "public"."enum_product_lines_status";
  DROP TYPE "public"."enum_topics_status";`)
}
