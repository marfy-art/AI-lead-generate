CREATE TABLE "workspace_settings" (
	"workspace_id" uuid PRIMARY KEY NOT NULL,
	"config_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "suppression_list" ADD COLUMN "display_label" text DEFAULT 'Suppressed value' NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace_settings" ADD CONSTRAINT "workspace_settings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "workspace members can manage settings" ON "workspace_settings" FOR ALL TO "authenticated" USING (EXISTS (SELECT 1 FROM "workspace_members" WHERE "workspace_members"."workspace_id" = "workspace_settings"."workspace_id" AND "workspace_members"."user_id" = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM "workspace_members" WHERE "workspace_members"."workspace_id" = "workspace_settings"."workspace_id" AND "workspace_members"."user_id" = auth.uid()));
