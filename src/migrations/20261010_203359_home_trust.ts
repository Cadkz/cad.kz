import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "home_page_trust_partners" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"vendor" varchar NOT NULL,
  	"status" varchar NOT NULL,
  	"note" varchar,
  	"logo_id" integer,
  	"href" varchar
  );
  
  CREATE TABLE "home_page_trust_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  ALTER TABLE "home_page" ADD COLUMN "trust_title" varchar;
  ALTER TABLE "home_page" ADD COLUMN "trust_lead" varchar;
  ALTER TABLE "home_page_trust_partners" ADD CONSTRAINT "home_page_trust_partners_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page_trust_partners" ADD CONSTRAINT "home_page_trust_partners_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_trust_links" ADD CONSTRAINT "home_page_trust_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "home_page_trust_partners_order_idx" ON "home_page_trust_partners" USING btree ("_order");
  CREATE INDEX "home_page_trust_partners_parent_id_idx" ON "home_page_trust_partners" USING btree ("_parent_id");
  CREATE INDEX "home_page_trust_partners_logo_idx" ON "home_page_trust_partners" USING btree ("logo_id");
  CREATE INDEX "home_page_trust_links_order_idx" ON "home_page_trust_links" USING btree ("_order");
  CREATE INDEX "home_page_trust_links_parent_id_idx" ON "home_page_trust_links" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "home_page_trust_partners" CASCADE;
  DROP TABLE "home_page_trust_links" CASCADE;
  ALTER TABLE "home_page" DROP COLUMN "trust_title";
  ALTER TABLE "home_page" DROP COLUMN "trust_lead";`)
}
