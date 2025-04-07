ALTER TABLE "usersToConversation" DROP CONSTRAINT "usersToConversation_member_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "usersToConversation" ADD COLUMN "last_message" uuid;--> statement-breakpoint
ALTER TABLE "usersToConversation" ADD CONSTRAINT "usersToConversation_last_message_message_id_fk" FOREIGN KEY ("last_message") REFERENCES "public"."message"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usersToConversation" ADD CONSTRAINT "usersToConversation_member_id_user_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;