import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_priority" AS ENUM('flagship', 'top', 'normal', 'low');
  CREATE TYPE "public"."enum_manufacturers_priority" AS ENUM('flagship', 'top', 'normal', 'low');
  ALTER TABLE "products" ADD COLUMN "priority" "enum_products_priority";
  ALTER TABLE "sections_rels" ADD COLUMN "manufacturers_id" integer;
  ALTER TABLE "manufacturers" ADD COLUMN "priority" "enum_manufacturers_priority" DEFAULT 'normal';
  ALTER TABLE "sections_rels" ADD CONSTRAINT "sections_rels_manufacturers_fk" FOREIGN KEY ("manufacturers_id") REFERENCES "public"."manufacturers"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "sections_rels_manufacturers_id_idx" ON "sections_rels" USING btree ("manufacturers_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sections_rels" DROP CONSTRAINT "sections_rels_manufacturers_fk";
  
  DROP INDEX "sections_rels_manufacturers_id_idx";
  ALTER TABLE "products" DROP COLUMN "priority";
  ALTER TABLE "sections_rels" DROP COLUMN "manufacturers_id";
  ALTER TABLE "manufacturers" DROP COLUMN "priority";
  DROP TYPE "public"."enum_products_priority";
  DROP TYPE "public"."enum_manufacturers_priority";`)
}
