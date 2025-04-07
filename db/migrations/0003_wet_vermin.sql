ALTER TABLE "usersToConversation" DROP CONSTRAINT "usersToConversation_last_message_message_id_fk";
--> statement-breakpoint
ALTER TABLE "usersToConversation" DROP COLUMN "last_message";