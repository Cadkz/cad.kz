import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_activity_log_action" ADD VALUE 'prices';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "activity_log" ALTER COLUMN "action" SET DATA TYPE text;
  DROP TYPE "public"."enum_activity_log_action";
  CREATE TYPE "public"."enum_activity_log_action" AS ENUM('rate', 'vat', 'price-list', 'import', 'crm', 'delete', 'users', 'kaddi');
  ALTER TABLE "activity_log" ALTER COLUMN "action" SET DATA TYPE "public"."enum_activity_log_action" USING "action"::"public"."enum_activity_log_action";`)
}
