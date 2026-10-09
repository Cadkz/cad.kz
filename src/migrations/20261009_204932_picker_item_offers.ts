import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products_picker_steps_items" DROP CONSTRAINT "products_picker_steps_items_offer_id_offers_id_fk";
  
  DROP INDEX "products_picker_steps_items_offer_idx";
  ALTER TABLE "products_rels" ADD COLUMN "offers_id" integer;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_offers_fk" FOREIGN KEY ("offers_id") REFERENCES "public"."offers"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_rels_offers_id_idx" ON "products_rels" USING btree ("offers_id");
  ALTER TABLE "products_picker_steps_items" DROP COLUMN "offer_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products_rels" DROP CONSTRAINT "products_rels_offers_fk";
  
  DROP INDEX "products_rels_offers_id_idx";
  ALTER TABLE "products_picker_steps_items" ADD COLUMN "offer_id" integer;
  ALTER TABLE "products_picker_steps_items" ADD CONSTRAINT "products_picker_steps_items_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "products_picker_steps_items_offer_idx" ON "products_picker_steps_items" USING btree ("offer_id");
  ALTER TABLE "products_rels" DROP COLUMN "offers_id";`)
}
