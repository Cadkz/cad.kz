import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "home_page_hero_tasks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"question" varchar NOT NULL
  );
  
  CREATE TABLE "_home_page_v_version_hero_tasks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"question" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  ALTER TABLE "home_page" ADD COLUMN "hero_lead" varchar;
  ALTER TABLE "home_page" ADD COLUMN "hero_button" varchar;
  ALTER TABLE "home_page" ADD COLUMN "hero_card_title" varchar;
  ALTER TABLE "home_page" ADD COLUMN "hero_placeholder" varchar;
  ALTER TABLE "home_page" ADD COLUMN "hero_note" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_hero_lead" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_hero_button" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_hero_card_title" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_hero_placeholder" varchar;
  ALTER TABLE "_home_page_v" ADD COLUMN "version_hero_note" varchar;
  ALTER TABLE "home_page_hero_tasks" ADD CONSTRAINT "home_page_hero_tasks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_version_hero_tasks" ADD CONSTRAINT "_home_page_v_version_hero_tasks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "home_page_hero_tasks_order_idx" ON "home_page_hero_tasks" USING btree ("_order");
  CREATE INDEX "home_page_hero_tasks_parent_id_idx" ON "home_page_hero_tasks" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_hero_tasks_order_idx" ON "_home_page_v_version_hero_tasks" USING btree ("_order");
  CREATE INDEX "_home_page_v_version_hero_tasks_parent_id_idx" ON "_home_page_v_version_hero_tasks" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "home_page_hero_tasks" CASCADE;
  DROP TABLE "_home_page_v_version_hero_tasks" CASCADE;
  ALTER TABLE "home_page" DROP COLUMN "hero_lead";
  ALTER TABLE "home_page" DROP COLUMN "hero_button";
  ALTER TABLE "home_page" DROP COLUMN "hero_card_title";
  ALTER TABLE "home_page" DROP COLUMN "hero_placeholder";
  ALTER TABLE "home_page" DROP COLUMN "hero_note";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_hero_lead";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_hero_button";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_hero_card_title";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_hero_placeholder";
  ALTER TABLE "_home_page_v" DROP COLUMN "version_hero_note";`)
}
