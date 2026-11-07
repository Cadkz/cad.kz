import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Названия публикаций, страниц и тем — по языкам (как у товаров, 07.11.2026), и служебная
 * коллекция «Части переводов» для длинных текстов. Названия КОПИРУЮТСЯ в русскую версию
 * (строка ru в *_locales: дополняется, если уже есть, или создаётся) и только потом старые
 * колонки удаляются; откат возвращает русские названия обратно. Колонки переводов без NOT NULL:
 * казахский и английский заполняются позже (Payload сам сделал бы NOT NULL).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_translation_parts_lang" AS ENUM('kk', 'en');
  CREATE TABLE "topics_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "translation_parts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"lang" "enum_translation_parts_lang" NOT NULL,
  	"part" numeric NOT NULL,
  	"source" varchar NOT NULL,
  	"text" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "publications_locales" ADD COLUMN "title" varchar;
  ALTER TABLE "_publications_v_locales" ADD COLUMN "version_title" varchar;
  ALTER TABLE "pages_locales" ADD COLUMN "title" varchar;
  ALTER TABLE "_pages_v_locales" ADD COLUMN "version_title" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "translation_parts_id" integer;
  ALTER TABLE "topics_locales" ADD CONSTRAINT "topics_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "topics_locales_locale_parent_id_unique" ON "topics_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "translation_parts_key_idx" ON "translation_parts" USING btree ("key");
  CREATE INDEX "translation_parts_updated_at_idx" ON "translation_parts" USING btree ("updated_at");
  CREATE INDEX "translation_parts_created_at_idx" ON "translation_parts" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_translation_parts_fk" FOREIGN KEY ("translation_parts_id") REFERENCES "public"."translation_parts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_translation_parts_id_idx" ON "payload_locked_documents_rels" USING btree ("translation_parts_id");

  INSERT INTO "publications_locales" ("title", "_locale", "_parent_id")
    SELECT "title", 'ru', "id" FROM "publications"
    ON CONFLICT ("_locale", "_parent_id") DO UPDATE SET "title" = EXCLUDED."title";
  INSERT INTO "_publications_v_locales" ("version_title", "_locale", "_parent_id")
    SELECT "version_title", 'ru', "id" FROM "_publications_v"
    ON CONFLICT ("_locale", "_parent_id") DO UPDATE SET "version_title" = EXCLUDED."version_title";
  INSERT INTO "pages_locales" ("title", "_locale", "_parent_id")
    SELECT "title", 'ru', "id" FROM "pages"
    ON CONFLICT ("_locale", "_parent_id") DO UPDATE SET "title" = EXCLUDED."title";
  INSERT INTO "_pages_v_locales" ("version_title", "_locale", "_parent_id")
    SELECT "version_title", 'ru', "id" FROM "_pages_v"
    ON CONFLICT ("_locale", "_parent_id") DO UPDATE SET "version_title" = EXCLUDED."version_title";
  INSERT INTO "topics_locales" ("title", "_locale", "_parent_id")
    SELECT "title", 'ru', "id" FROM "topics";

  ALTER TABLE "publications" DROP COLUMN "title";
  ALTER TABLE "_publications_v" DROP COLUMN "version_title";
  ALTER TABLE "pages" DROP COLUMN "title";
  ALTER TABLE "_pages_v" DROP COLUMN "version_title";
  ALTER TABLE "topics" DROP COLUMN "title";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "publications" ADD COLUMN "title" varchar;
  ALTER TABLE "_publications_v" ADD COLUMN "version_title" varchar;
  ALTER TABLE "pages" ADD COLUMN "title" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_title" varchar;
  ALTER TABLE "topics" ADD COLUMN "title" varchar;
  UPDATE "publications" SET "title" = l."title"
    FROM "publications_locales" l WHERE l."_parent_id" = "publications"."id" AND l."_locale" = 'ru';
  UPDATE "_publications_v" SET "version_title" = l."version_title"
    FROM "_publications_v_locales" l WHERE l."_parent_id" = "_publications_v"."id" AND l."_locale" = 'ru';
  UPDATE "pages" SET "title" = l."title"
    FROM "pages_locales" l WHERE l."_parent_id" = "pages"."id" AND l."_locale" = 'ru';
  UPDATE "_pages_v" SET "version_title" = l."version_title"
    FROM "_pages_v_locales" l WHERE l."_parent_id" = "_pages_v"."id" AND l."_locale" = 'ru';
  UPDATE "topics" SET "title" = l."title"
    FROM "topics_locales" l WHERE l."_parent_id" = "topics"."id" AND l."_locale" = 'ru';
  UPDATE "publications" SET "title" = '' WHERE "title" IS NULL;
  UPDATE "_publications_v" SET "version_title" = '' WHERE "version_title" IS NULL;
  UPDATE "pages" SET "title" = '' WHERE "title" IS NULL;
  UPDATE "_pages_v" SET "version_title" = '' WHERE "version_title" IS NULL;
  UPDATE "topics" SET "title" = '' WHERE "title" IS NULL;
  ALTER TABLE "publications" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "_publications_v" ALTER COLUMN "version_title" SET NOT NULL;
  ALTER TABLE "pages" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "_pages_v" ALTER COLUMN "version_title" SET NOT NULL;
  ALTER TABLE "topics" ALTER COLUMN "title" SET NOT NULL;

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_translation_parts_fk";
  DROP INDEX "payload_locked_documents_rels_translation_parts_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "translation_parts_id";
  DROP TABLE "topics_locales" CASCADE;
  DROP TABLE "translation_parts" CASCADE;
  ALTER TABLE "publications_locales" DROP COLUMN "title";
  ALTER TABLE "_publications_v_locales" DROP COLUMN "version_title";
  ALTER TABLE "pages_locales" DROP COLUMN "title";
  ALTER TABLE "_pages_v_locales" DROP COLUMN "version_title";
  DROP TYPE "public"."enum_translation_parts_lang";`)
}
