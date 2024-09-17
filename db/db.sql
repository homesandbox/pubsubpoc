-- schema creation
CREATE TABLE IF NOT EXISTS "user" (
	"id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	"email" TEXT,
	"created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "team" (
	"id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	"name" TEXT,
	"created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "team_participants" (
	"id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	"team_id" UUID REFERENCES "team"("id") ON DELETE CASCADE NOT NULL,
	"user_id" UUID REFERENCES "user"("id") ON DELETE CASCADE NOT NULL
);
ALTER TABLE "public"."team_participants" ADD CONSTRAINT "no_duplicate_user_in_team_check" UNIQUE ("team_id", "user_id");

CREATE TABLE IF NOT EXISTS "message" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	"team_id" UUID REFERENCES "team"("id") ON DELETE CASCADE NOT NULL,
	"type_id" BIGINT,
	"sender_id" UUID REFERENCES "user"("id") ON DELETE SET NULL, -- should point to "user"/ can be null, display as "deleted account"
	"payload" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- maybe its better to have a type under a message table to do the check on the payload
-- "type" = 'ATTACHMENT' THEN "payload" should be a LINK
CREATE TABLE IF NOT EXISTS "message_type" (
	"id" SERIAL PRIMARY KEY,
	"type" TEXT,
	CONSTRAINT "message_type_check" CHECK ("type" IN ('TEXT', 'ATTACHMENT'))
);

CREATE TABLE IF NOT EXISTS "chat" (
	"id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	"azure_hub_id" TEXT,
	"name" TEXT,
	"created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "chat_partisipants" (
	"id" UUID DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
	"chat_id" UUID REFERENCES "chat"("id") ON DELETE CASCADE NOT NULL,
	"user_id" UUID REFERENCES "user"("id") ON DELETE CASCADE NOT NULL,
	"created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE "public"."chat_partisipants" ADD CONSTRAINT "no_duplicate_user_in_chat_check" UNIQUE ("chat_id", "user_id");

-- seeds
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM "public"."message_type"
		WHERE "type" IN ('TEXT', 'ATTACHMENT')
	) THEN
		INSERT INTO "public"."message_type"
			("type")
		VALUES
			('TEXT'),
			('ATTACHMENT')
		;
	END IF;
END $$;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM "public"."chat"
		WHERE "name" IN ('messages', 'notifications')
	) THEN
		INSERT INTO "public"."chat"
			("name")
		VALUES
			('messages'),
			('notifications')
		;
	END IF;
END $$;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM "public"."team"
		WHERE "name" IN ('test_team_one', 'test_team_two')
	) THEN
		INSERT INTO "public"."team"
			("name")
		VALUES
			('test_team_one'),
			('test_team_two')
		;
	END IF;
END $$;
