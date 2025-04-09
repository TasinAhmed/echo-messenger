import { pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { conversation } from "./conversation";
import { user } from "./auth-schema";

export const usersToConversation = pgTable(
  "usersToConversation",
  {
    memberId: uuid()
      .notNull()
      .references(() => user.id),
    conversationId: uuid().references(() => conversation.id, {
      onDelete: "cascade",
    }),
    joinedAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    {
      compositePk: primaryKey({
        columns: [table.memberId, table.conversationId],
      }),
    },
  ]
);

export const usersToConversationsRealtions = relations(
  usersToConversation,
  ({ one }) => ({
    user: one(user, {
      fields: [usersToConversation.memberId],
      references: [user.id],
    }),
    conversation: one(conversation, {
      fields: [usersToConversation.conversationId],
      references: [conversation.id],
    }),
  })
);
