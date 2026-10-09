import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_section_rules_kind" AS ENUM('software', 'hardware', 'course', 'service');
  CREATE TABLE "sections_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"sections_id" integer
  );
  
  CREATE TABLE "section_rules" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"order" numeric DEFAULT 1000 NOT NULL,
  	"manufacturer_id" integer,
  	"kind" "enum_section_rules_kind",
  	"words" varchar,
  	"main_section_id" integer,
  	"retire" boolean,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "section_rules_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"sections_id" integer
  );
  
  ALTER TABLE "products" ADD COLUMN "auto_sections" boolean DEFAULT true;
  ALTER TABLE "products" ADD COLUMN "main_section_id" integer;
  ALTER TABLE "products" ADD COLUMN "suggest_similar" boolean DEFAULT true;
  ALTER TABLE "products" ADD COLUMN "suggest_cross" boolean DEFAULT true;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "section_rules_id" integer;
  ALTER TABLE "sections_rels" ADD CONSTRAINT "sections_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sections_rels" ADD CONSTRAINT "sections_rels_sections_fk" FOREIGN KEY ("sections_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_rules" ADD CONSTRAINT "section_rules_manufacturer_id_manufacturers_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "section_rules" ADD CONSTRAINT "section_rules_main_section_id_sections_id_fk" FOREIGN KEY ("main_section_id") REFERENCES "public"."sections"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "section_rules_rels" ADD CONSTRAINT "section_rules_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."section_rules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "section_rules_rels" ADD CONSTRAINT "section_rules_rels_sections_fk" FOREIGN KEY ("sections_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "sections_rels_order_idx" ON "sections_rels" USING btree ("order");
  CREATE INDEX "sections_rels_parent_idx" ON "sections_rels" USING btree ("parent_id");
  CREATE INDEX "sections_rels_path_idx" ON "sections_rels" USING btree ("path");
  CREATE INDEX "sections_rels_sections_id_idx" ON "sections_rels" USING btree ("sections_id");
  CREATE INDEX "section_rules_manufacturer_idx" ON "section_rules" USING btree ("manufacturer_id");
  CREATE INDEX "section_rules_main_section_idx" ON "section_rules" USING btree ("main_section_id");
  CREATE INDEX "section_rules_updated_at_idx" ON "section_rules" USING btree ("updated_at");
  CREATE INDEX "section_rules_created_at_idx" ON "section_rules" USING btree ("created_at");
  CREATE INDEX "section_rules_rels_order_idx" ON "section_rules_rels" USING btree ("order");
  CREATE INDEX "section_rules_rels_parent_idx" ON "section_rules_rels" USING btree ("parent_id");
  CREATE INDEX "section_rules_rels_path_idx" ON "section_rules_rels" USING btree ("path");
  CREATE INDEX "section_rules_rels_sections_id_idx" ON "section_rules_rels" USING btree ("sections_id");
  ALTER TABLE "products" ADD CONSTRAINT "products_main_section_id_sections_id_fk" FOREIGN KEY ("main_section_id") REFERENCES "public"."sections"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_section_rules_fk" FOREIGN KEY ("section_rules_id") REFERENCES "public"."section_rules"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_main_section_idx" ON "products" USING btree ("main_section_id");
  CREATE INDEX "payload_locked_documents_rels_section_rules_id_idx" ON "payload_locked_documents_rels" USING btree ("section_rules_id");`)

  // Товары, у которых разделы уже стояли (демотовары): первый раздел становится основным,
  // остальные — дополнительными, разделы считаются заданными вручную.
  await db.execute(sql`
  UPDATE "products" p SET "main_section_id" = r."sections_id", "auto_sections" = false
  FROM (
    SELECT DISTINCT ON ("parent_id") "parent_id", "sections_id"
    FROM "products_rels" WHERE "path" = 'sections' AND "sections_id" IS NOT NULL
    ORDER BY "parent_id", "order"
  ) r
  WHERE r."parent_id" = p."id" AND p."main_section_id" IS NULL;
  INSERT INTO "products_rels" ("order", "parent_id", "path", "sections_id")
  SELECT r."order", r."parent_id", 'extraSections', r."sections_id"
  FROM "products_rels" r JOIN "products" p ON p."id" = r."parent_id"
  WHERE r."path" = 'sections' AND r."sections_id" IS NOT NULL
    AND r."sections_id" <> p."main_section_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sections_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "section_rules" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "section_rules_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "sections_rels" CASCADE;
  DROP TABLE "section_rules" CASCADE;
  DROP TABLE "section_rules_rels" CASCADE;
  ALTER TABLE "products" DROP CONSTRAINT "products_main_section_id_sections_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_section_rules_fk";
  
  DROP INDEX "products_main_section_idx";
  DROP INDEX "payload_locked_documents_rels_section_rules_id_idx";
  ALTER TABLE "products" DROP COLUMN "auto_sections";
  ALTER TABLE "products" DROP COLUMN "main_section_id";
  ALTER TABLE "products" DROP COLUMN "suggest_similar";
  ALTER TABLE "products" DROP COLUMN "suggest_cross";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "section_rules_id";
  DROP TYPE "public"."enum_section_rules_kind";`)
}
