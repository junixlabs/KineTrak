CREATE TABLE "agent_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"kind" text NOT NULL,
	"asked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"text" text NOT NULL,
	"tool" text,
	"answer" text
);
--> statement-breakpoint
CREATE TABLE "tool_calls" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"ts" timestamp with time zone DEFAULT now() NOT NULL,
	"org_id" text NOT NULL,
	"project_id" text,
	"key_id" text NOT NULL,
	"actor" text NOT NULL,
	"tool" text NOT NULL,
	"params" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"outcome" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "agent_questions_project_idx" ON "agent_questions" USING btree ("project_id","asked_at");--> statement-breakpoint
CREATE INDEX "tool_calls_run_idx" ON "tool_calls" USING btree ("org_id","key_id","id");