import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "bim_page_proof" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "bim_page_proof_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "bim_page_services" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "bim_page_services_locales" (
  	"title" varchar,
  	"problem" varchar,
  	"work" varchar,
  	"result" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "bim_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"cta_link_href" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "bim_page_locales" (
  	"intro_eyebrow" varchar,
  	"intro_title" varchar,
  	"intro_text" varchar,
  	"help_eyebrow" varchar,
  	"help_title" varchar,
  	"help_text" varchar,
  	"services_title" varchar,
  	"outcome_eyebrow" varchar,
  	"outcome_title" varchar,
  	"outcome_text" varchar,
  	"cta_title" varchar,
  	"cta_text" varchar,
  	"cta_link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "bim_page_proof" ADD CONSTRAINT "bim_page_proof_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bim_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bim_page_proof_locales" ADD CONSTRAINT "bim_page_proof_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bim_page_proof"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bim_page_services" ADD CONSTRAINT "bim_page_services_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bim_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bim_page_services_locales" ADD CONSTRAINT "bim_page_services_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bim_page_services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bim_page_locales" ADD CONSTRAINT "bim_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bim_page"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "bim_page_proof_order_idx" ON "bim_page_proof" USING btree ("_order");
  CREATE INDEX "bim_page_proof_parent_id_idx" ON "bim_page_proof" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "bim_page_proof_locales_locale_parent_id_unique" ON "bim_page_proof_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "bim_page_services_order_idx" ON "bim_page_services" USING btree ("_order");
  CREATE INDEX "bim_page_services_parent_id_idx" ON "bim_page_services" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "bim_page_services_locales_locale_parent_id_unique" ON "bim_page_services_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "bim_page_locales_locale_parent_id_unique" ON "bim_page_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "bim_page_proof" CASCADE;
  DROP TABLE "bim_page_proof_locales" CASCADE;
  DROP TABLE "bim_page_services" CASCADE;
  DROP TABLE "bim_page_services_locales" CASCADE;
  DROP TABLE "bim_page" CASCADE;
  DROP TABLE "bim_page_locales" CASCADE;`)
}
