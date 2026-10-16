import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_page" DROP COLUMN "hero_button";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_hero_button";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_page" ADD COLUMN "hero_button" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_hero_button" varchar;`)
}
