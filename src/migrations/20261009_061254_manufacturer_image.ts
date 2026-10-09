import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "manufacturers" ADD COLUMN "image_id" integer;
  ALTER TABLE "manufacturers" ADD CONSTRAINT "manufacturers_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "manufacturers_image_idx" ON "manufacturers" USING btree ("image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "manufacturers" DROP CONSTRAINT "manufacturers_image_id_media_id_fk";
  
  DROP INDEX "manufacturers_image_idx";
  ALTER TABLE "manufacturers" DROP COLUMN "image_id";`)
}
