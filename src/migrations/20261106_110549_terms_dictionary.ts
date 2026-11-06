import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "terms" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ru" varchar NOT NULL,
  	"kk" varchar,
  	"en" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "terms_id" integer;
  CREATE UNIQUE INDEX "terms_ru_idx" ON "terms" USING btree ("ru");
  CREATE INDEX "terms_updated_at_idx" ON "terms" USING btree ("updated_at");
  CREATE INDEX "terms_created_at_idx" ON "terms" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_terms_fk" FOREIGN KEY ("terms_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_terms_id_idx" ON "payload_locked_documents_rels" USING btree ("terms_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "terms" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "terms" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_terms_fk";
  
  DROP INDEX "payload_locked_documents_rels_terms_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "terms_id";`)
}
