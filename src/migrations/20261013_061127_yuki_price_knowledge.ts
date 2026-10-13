import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "assistant_knowledge" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"product" varchar DEFAULT 'Все',
  	"active" boolean DEFAULT true,
  	"position" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "price_tables" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"state" varchar NOT NULL,
  	"summary" jsonb NOT NULL,
  	"snapshot" jsonb NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "assistant_knowledge_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "price_tables_id" integer;
  CREATE INDEX "assistant_knowledge_updated_at_idx" ON "assistant_knowledge" USING btree ("updated_at");
  CREATE INDEX "assistant_knowledge_created_at_idx" ON "assistant_knowledge" USING btree ("created_at");
  CREATE INDEX "price_tables_state_idx" ON "price_tables" USING btree ("state");
  CREATE INDEX "price_tables_updated_at_idx" ON "price_tables" USING btree ("updated_at");
  CREATE INDEX "price_tables_created_at_idx" ON "price_tables" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_assistant_knowledge_fk" FOREIGN KEY ("assistant_knowledge_id") REFERENCES "public"."assistant_knowledge"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_price_tables_fk" FOREIGN KEY ("price_tables_id") REFERENCES "public"."price_tables"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_assistant_knowledge_id_idx" ON "payload_locked_documents_rels" USING btree ("assistant_knowledge_id");
  CREATE INDEX "payload_locked_documents_rels_price_tables_id_idx" ON "payload_locked_documents_rels" USING btree ("price_tables_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "assistant_knowledge" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "price_tables" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "assistant_knowledge" CASCADE;
  DROP TABLE "price_tables" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_assistant_knowledge_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_price_tables_fk";
  
  DROP INDEX "payload_locked_documents_rels_assistant_knowledge_id_idx";
  DROP INDEX "payload_locked_documents_rels_price_tables_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "assistant_knowledge_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "price_tables_id";`)
}
