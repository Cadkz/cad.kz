import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_quality_gaps" AS ENUM('offers', 'price', 'image', 'description', 'summary', 'section');
  CREATE TYPE "public"."enum__products_v_version_quality_gaps" AS ENUM('offers', 'price', 'image', 'description', 'summary', 'section');
  CREATE TYPE "public"."enum_payload_query_presets_access_read_constraint" AS ENUM('everyone', 'onlyMe', 'specificUsers');
  CREATE TYPE "public"."enum_payload_query_presets_access_update_constraint" AS ENUM('everyone', 'onlyMe', 'specificUsers', 'admins');
  CREATE TYPE "public"."enum_payload_query_presets_access_delete_constraint" AS ENUM('everyone', 'onlyMe', 'specificUsers', 'admins');
  CREATE TYPE "public"."enum_payload_query_presets_related_collection" AS ENUM('products', 'offers', 'publications');
  CREATE TABLE "products_quality_gaps" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_products_quality_gaps",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_products_v_version_quality_gaps" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__products_v_version_quality_gaps",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "payload_query_presets" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"is_shared" boolean DEFAULT false,
  	"access_read_constraint" "enum_payload_query_presets_access_read_constraint" DEFAULT 'onlyMe',
  	"access_update_constraint" "enum_payload_query_presets_access_update_constraint" DEFAULT 'onlyMe',
  	"access_delete_constraint" "enum_payload_query_presets_access_delete_constraint" DEFAULT 'onlyMe',
  	"where" jsonb,
  	"columns" jsonb,
  	"group_by" varchar,
  	"related_collection" "enum_payload_query_presets_related_collection" NOT NULL,
  	"is_temp" boolean,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_query_presets_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  ALTER TABLE "products" ADD COLUMN "quality_score" numeric;
  ALTER TABLE "_products_v" ADD COLUMN "version_quality_score" numeric;
  ALTER TABLE "products_quality_gaps" ADD CONSTRAINT "products_quality_gaps_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_quality_gaps" ADD CONSTRAINT "_products_v_version_quality_gaps_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_query_presets_rels" ADD CONSTRAINT "payload_query_presets_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_query_presets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_query_presets_rels" ADD CONSTRAINT "payload_query_presets_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_quality_gaps_order_idx" ON "products_quality_gaps" USING btree ("order");
  CREATE INDEX "products_quality_gaps_parent_idx" ON "products_quality_gaps" USING btree ("parent_id");
  CREATE INDEX "_products_v_version_quality_gaps_order_idx" ON "_products_v_version_quality_gaps" USING btree ("order");
  CREATE INDEX "_products_v_version_quality_gaps_parent_idx" ON "_products_v_version_quality_gaps" USING btree ("parent_id");
  CREATE INDEX "payload_query_presets_updated_at_idx" ON "payload_query_presets" USING btree ("updated_at");
  CREATE INDEX "payload_query_presets_created_at_idx" ON "payload_query_presets" USING btree ("created_at");
  CREATE INDEX "payload_query_presets_rels_order_idx" ON "payload_query_presets_rels" USING btree ("order");
  CREATE INDEX "payload_query_presets_rels_parent_idx" ON "payload_query_presets_rels" USING btree ("parent_id");
  CREATE INDEX "payload_query_presets_rels_path_idx" ON "payload_query_presets_rels" USING btree ("path");
  CREATE INDEX "payload_query_presets_rels_users_id_idx" ON "payload_query_presets_rels" USING btree ("users_id");
  CREATE INDEX "products_quality_score_idx" ON "products" USING btree ("quality_score");
  CREATE INDEX "_products_v_version_version_quality_score_idx" ON "_products_v" USING btree ("version_quality_score");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products_quality_gaps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_products_v_version_quality_gaps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_query_presets" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_query_presets_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "products_quality_gaps" CASCADE;
  DROP TABLE "_products_v_version_quality_gaps" CASCADE;
  DROP TABLE "payload_query_presets" CASCADE;
  DROP TABLE "payload_query_presets_rels" CASCADE;
  DROP INDEX "products_quality_score_idx";
  DROP INDEX "_products_v_version_version_quality_score_idx";
  ALTER TABLE "products" DROP COLUMN "quality_score";
  ALTER TABLE "_products_v" DROP COLUMN "version_quality_score";
  DROP TYPE "public"."enum_products_quality_gaps";
  DROP TYPE "public"."enum__products_v_version_quality_gaps";
  DROP TYPE "public"."enum_payload_query_presets_access_read_constraint";
  DROP TYPE "public"."enum_payload_query_presets_access_update_constraint";
  DROP TYPE "public"."enum_payload_query_presets_access_delete_constraint";
  DROP TYPE "public"."enum_payload_query_presets_related_collection";`)
}
