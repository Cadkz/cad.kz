import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" ADD COLUMN "top_order" numeric;
  ALTER TABLE "products" ADD COLUMN "card_image_id" integer;
  ALTER TABLE "_products_v" ADD COLUMN "version_top_order" numeric;
  ALTER TABLE "_products_v" ADD COLUMN "version_card_image_id" integer;
  ALTER TABLE "manufacturers" ADD COLUMN "logo_id" integer;
  ALTER TABLE "_manufacturers_v" ADD COLUMN "version_logo_id" integer;
  ALTER TABLE "products" ADD CONSTRAINT "products_card_image_id_media_id_fk" FOREIGN KEY ("card_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_card_image_id_media_id_fk" FOREIGN KEY ("version_card_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "manufacturers" ADD CONSTRAINT "manufacturers_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_manufacturers_v" ADD CONSTRAINT "_manufacturers_v_version_logo_id_media_id_fk" FOREIGN KEY ("version_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "products_card_image_idx" ON "products" USING btree ("card_image_id");
  CREATE INDEX "_products_v_version_version_card_image_idx" ON "_products_v" USING btree ("version_card_image_id");
  CREATE INDEX "manufacturers_logo_idx" ON "manufacturers" USING btree ("logo_id");
  CREATE INDEX "_manufacturers_v_version_version_logo_idx" ON "_manufacturers_v" USING btree ("version_logo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" DROP CONSTRAINT "products_card_image_id_media_id_fk";
  
  ALTER TABLE "_products_v" DROP CONSTRAINT "_products_v_version_card_image_id_media_id_fk";
  
  ALTER TABLE "manufacturers" DROP CONSTRAINT "manufacturers_logo_id_media_id_fk";
  
  ALTER TABLE "_manufacturers_v" DROP CONSTRAINT "_manufacturers_v_version_logo_id_media_id_fk";
  
  DROP INDEX "products_card_image_idx";
  DROP INDEX "_products_v_version_version_card_image_idx";
  DROP INDEX "manufacturers_logo_idx";
  DROP INDEX "_manufacturers_v_version_version_logo_idx";
  ALTER TABLE "products" DROP COLUMN "top_order";
  ALTER TABLE "products" DROP COLUMN "card_image_id";
  ALTER TABLE "_products_v" DROP COLUMN "version_top_order";
  ALTER TABLE "_products_v" DROP COLUMN "version_card_image_id";
  ALTER TABLE "manufacturers" DROP COLUMN "logo_id";
  ALTER TABLE "_manufacturers_v" DROP COLUMN "version_logo_id";`)
}
