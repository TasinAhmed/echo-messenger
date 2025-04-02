import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { conversation } from "./conversation";
import { relations } from "drizzle-orm";
import { user } from "./auth-schema";

export const message = pgTable("message", {
  id: uuid().defaultRandom().primaryKey(),
  senderId: uuid()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  message: text().notNull(),
  conversationId: uuid()
    .notNull()
    .references(() => conversation.id, { onDelete: "cascade" }),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const messagesRelation = relations(message, ({ one }) => ({
  sender: one(user, {
    fields: [message.senderId],
    references: [user.id],
  }),
  conversation: one(conversation, {
    fields: [message.conversationId],
    references: [conversation.id],
  }),
}));
