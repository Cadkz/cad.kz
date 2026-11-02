import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "site_settings_purchase_terms_software" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_purchase_terms_hardware" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "_site_settings_v_version_purchase_terms_software" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_settings_v_version_purchase_terms_hardware" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  ALTER TABLE "site_settings_purchase_terms_software" ADD CONSTRAINT "site_settings_purchase_terms_software_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_purchase_terms_hardware" ADD CONSTRAINT "site_settings_purchase_terms_hardware_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_purchase_terms_software" ADD CONSTRAINT "_site_settings_v_version_purchase_terms_software_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_purchase_terms_hardware" ADD CONSTRAINT "_site_settings_v_version_purchase_terms_hardware_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_purchase_terms_software_order_idx" ON "site_settings_purchase_terms_software" USING btree ("_order");
  CREATE INDEX "site_settings_purchase_terms_software_parent_id_idx" ON "site_settings_purchase_terms_software" USING btree ("_parent_id");
  CREATE INDEX "site_settings_purchase_terms_hardware_order_idx" ON "site_settings_purchase_terms_hardware" USING btree ("_order");
  CREATE INDEX "site_settings_purchase_terms_hardware_parent_id_idx" ON "site_settings_purchase_terms_hardware" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_purchase_terms_software_order_idx" ON "_site_settings_v_version_purchase_terms_software" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_purchase_terms_software_parent_id_idx" ON "_site_settings_v_version_purchase_terms_software" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_purchase_terms_hardware_order_idx" ON "_site_settings_v_version_purchase_terms_hardware" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_purchase_terms_hardware_parent_id_idx" ON "_site_settings_v_version_purchase_terms_hardware" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "site_settings_purchase_terms_software" CASCADE;
  DROP TABLE "site_settings_purchase_terms_hardware" CASCADE;
  DROP TABLE "_site_settings_v_version_purchase_terms_software" CASCADE;
  DROP TABLE "_site_settings_v_version_purchase_terms_hardware" CASCADE;`)
}
