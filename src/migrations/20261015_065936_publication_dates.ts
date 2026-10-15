import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "publications" ALTER COLUMN "kind" SET DEFAULT 'news';
  ALTER TABLE "publications" ADD COLUMN "hide_after" timestamp(3) with time zone;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "publications" ALTER COLUMN "kind" DROP DEFAULT;
  ALTER TABLE "publications" DROP COLUMN "hide_after";`)
}
