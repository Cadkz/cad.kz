import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_scans_scan" AS ENUM('leo-car-engine', 'leo-bmw-manifold', 'leo-pipework', 'leo-axle-shaft', 'eva-cylinder-head', 'eva-moto-wheel', 'eva-side-table', 'eva-metal-table', 'spider-water-pump', 'spider-water-pump-2', 'spider-gamepad', 'spider-metal-part', 'micro-industrial-part', 'micro-screw', 'micro-copper-key', 'micro-teeth', 'point-engine', 'point-cam-gear', 'point-car-rim', 'ray-church-facade', 'ray-pipes');
  CREATE TYPE "public"."enum__products_v_version_scans_scan" AS ENUM('leo-car-engine', 'leo-bmw-manifold', 'leo-pipework', 'leo-axle-shaft', 'eva-cylinder-head', 'eva-moto-wheel', 'eva-side-table', 'eva-metal-table', 'spider-water-pump', 'spider-water-pump-2', 'spider-gamepad', 'spider-metal-part', 'micro-industrial-part', 'micro-screw', 'micro-copper-key', 'micro-teeth', 'point-engine', 'point-cam-gear', 'point-car-rim', 'ray-church-facade', 'ray-pipes');
  CREATE TABLE "products_scans" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"scan" "enum_products_scans_scan" NOT NULL,
  	"title" varchar
  );
  
  CREATE TABLE "_products_v_version_scans" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"scan" "enum__products_v_version_scans_scan" NOT NULL,
  	"title" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "products_scans" ADD CONSTRAINT "products_scans_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_scans" ADD CONSTRAINT "_products_v_version_scans_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_scans_order_idx" ON "products_scans" USING btree ("_order");
  CREATE INDEX "products_scans_parent_id_idx" ON "products_scans" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_scans_order_idx" ON "_products_v_version_scans" USING btree ("_order");
  CREATE INDEX "_products_v_version_scans_parent_id_idx" ON "_products_v_version_scans" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "products_scans" CASCADE;
  DROP TABLE "_products_v_version_scans" CASCADE;
  DROP TYPE "public"."enum_products_scans_scan";
  DROP TYPE "public"."enum__products_v_version_scans_scan";`)
}
