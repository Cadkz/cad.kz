import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "search_queries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"query" varchar NOT NULL,
  	"found" numeric NOT NULL,
  	"source" varchar NOT NULL,
  	"click" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "search_queries_id" integer;
  CREATE INDEX "search_queries_query_idx" ON "search_queries" USING btree ("query");
  CREATE INDEX "search_queries_updated_at_idx" ON "search_queries" USING btree ("updated_at");
  CREATE INDEX "search_queries_created_at_idx" ON "search_queries" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_search_queries_fk" FOREIGN KEY ("search_queries_id") REFERENCES "public"."search_queries"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_search_queries_id_idx" ON "payload_locked_documents_rels" USING btree ("search_queries_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "search_queries" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "search_queries" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_search_queries_fk";
  
  DROP INDEX "payload_locked_documents_rels_search_queries_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "search_queries_id";`)
}
