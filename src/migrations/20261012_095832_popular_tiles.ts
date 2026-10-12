import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_page_popular_items" DROP COLUMN "text";
  ALTER TABLE "home_page_popular_items" DROP COLUMN "button_label";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_page_popular_items" ADD COLUMN "text" varchar;
  ALTER TABLE "home_page_popular_items" ADD COLUMN "button_label" varchar;`)
}
