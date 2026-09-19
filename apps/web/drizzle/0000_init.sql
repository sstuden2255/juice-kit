CREATE TABLE "analytics_daily" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "analytics_daily_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"day" date NOT NULL,
	"event" varchar(64) NOT NULL,
	"component" varchar(64),
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "analytics_daily_day_event_component_uq" UNIQUE NULLS NOT DISTINCT("day","event","component")
);
--> statement-breakpoint
CREATE TABLE "playground_shares" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "playground_shares_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" varchar(21) NOT NULL,
	"component" varchar(64) NOT NULL,
	"props" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waitlist_signups" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "waitlist_signups_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"email" varchar(320) NOT NULL,
	"source" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "waitlist_signups_email_uq" UNIQUE("email"),
	CONSTRAINT "waitlist_signups_email_lowercase" CHECK ("waitlist_signups"."email" = lower("waitlist_signups"."email"))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "playground_shares_slug_idx" ON "playground_shares" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "playground_shares_component_idx" ON "playground_shares" USING btree ("component");