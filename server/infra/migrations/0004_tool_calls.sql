CREATE TABLE "agent_questions" (
	"row_id" bigserial PRIMARY KEY NOT NULL,
	"id" text NOT NULL,
	"org_id" text NOT NULL,
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
CREATE UNIQUE INDEX "agent_questions_alert_idx" ON "agent_questions" USING btree ("org_id","project_id","id");--> statement-breakpoint
CREATE INDEX "agent_questions_org_idx" ON "agent_questions" USING btree ("org_id","asked_at");--> statement-breakpoint
CREATE INDEX "agent_questions_project_idx" ON "agent_questions" USING btree ("project_id","asked_at");--> statement-breakpoint
CREATE INDEX "tool_calls_org_idx" ON "tool_calls" USING btree ("org_id","id");--> statement-breakpoint
CREATE INDEX "tool_calls_project_idx" ON "tool_calls" USING btree ("org_id","project_id","ts");