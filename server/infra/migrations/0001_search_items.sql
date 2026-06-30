CREATE TABLE "search_items" (
	"project_id" text NOT NULL,
	"kind" text NOT NULL,
	"item_id" text NOT NULL,
	"label" text NOT NULL,
	"text" text NOT NULL,
	CONSTRAINT "search_items_project_id_kind_item_id_pk" PRIMARY KEY("project_id","kind","item_id")
);
--> statement-breakpoint
ALTER TABLE "search_items" ADD CONSTRAINT "search_items_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "search_items_project_idx" ON "search_items" USING btree ("project_id");