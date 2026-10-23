import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "manufacturers" ADD COLUMN "order" numeric;
  ALTER TABLE "_manufacturers_v" ADD COLUMN "version_order" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "manufacturers" DROP COLUMN "order";
  ALTER TABLE "_manufacturers_v" DROP COLUMN "version_order";`)
}
