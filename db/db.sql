-- schema creation
CREATE TABLE IF NOT EXISTS "message" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	"team_id" BIGINT, -- should point to "team" table
	"type_id" BIGINT,
	"sender_id" BIGINT, -- should point to "user"/ can be null, display as "deleted account"
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
	"created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "chat_partisipants" (
	"id" UUID DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
	"chat_id" UUID REFERENCES "chat"("id") ON DELETE CASCADE NOT NULL,
	"user_id" BIGINT NOT NULL,
	"created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

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
