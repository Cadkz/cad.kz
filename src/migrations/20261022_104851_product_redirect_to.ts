import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" ADD COLUMN "redirect_to_id" integer;
  ALTER TABLE "_products_v" ADD COLUMN "version_redirect_to_id" integer;
  ALTER TABLE "products" ADD CONSTRAINT "products_redirect_to_id_products_id_fk" FOREIGN KEY ("redirect_to_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_redirect_to_id_products_id_fk" FOREIGN KEY ("version_redirect_to_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "products_redirect_to_idx" ON "products" USING btree ("redirect_to_id");
  CREATE INDEX "_products_v_version_version_redirect_to_idx" ON "_products_v" USING btree ("version_redirect_to_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" DROP CONSTRAINT "products_redirect_to_id_products_id_fk";
  
  ALTER TABLE "_products_v" DROP CONSTRAINT "_products_v_version_redirect_to_id_products_id_fk";
  
  DROP INDEX "products_redirect_to_idx";
  DROP INDEX "_products_v_version_version_redirect_to_idx";
  ALTER TABLE "products" DROP COLUMN "redirect_to_id";
  ALTER TABLE "_products_v" DROP COLUMN "version_redirect_to_id";`)
}
