CREATE TABLE "org_board_shares" (
	"token" text PRIMARY KEY NOT NULL,
	"org_board_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "org_board_shares" ADD CONSTRAINT "org_board_shares_org_board_id_org_boards_id_fk" FOREIGN KEY ("org_board_id") REFERENCES "public"."org_boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "org_board_shares_board_idx" ON "org_board_shares" USING btree ("org_board_id");