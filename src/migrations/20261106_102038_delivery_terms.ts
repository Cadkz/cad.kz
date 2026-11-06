import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "manufacturers_locales" (
  	"delivery_software" varchar,
  	"delivery_hardware" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_manufacturers_v_locales" (
  	"version_delivery_software" varchar,
  	"version_delivery_hardware" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "products_locales" ADD COLUMN "delivery" varchar;
  ALTER TABLE "_products_v_locales" ADD COLUMN "version_delivery" varchar;
  ALTER TABLE "manufacturers_locales" ADD CONSTRAINT "manufacturers_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."manufacturers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_manufacturers_v_locales" ADD CONSTRAINT "_manufacturers_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_manufacturers_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "manufacturers_locales_locale_parent_id_unique" ON "manufacturers_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_manufacturers_v_locales_locale_parent_id_unique" ON "_manufacturers_v_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "manufacturers_locales" CASCADE;
  DROP TABLE "_manufacturers_v_locales" CASCADE;
  ALTER TABLE "products_locales" DROP COLUMN "delivery";
  ALTER TABLE "_products_v_locales" DROP COLUMN "version_delivery";`)
}
