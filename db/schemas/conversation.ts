import { relations } from "drizzle-orm";
import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { message } from "./message";
import { usersToConversation } from "./usersToConversation";

export const typeEnum = pgEnum("type", ["PRIVATE", "GROUP"]);

export const conversation = pgTable("conversation", {
  id: uuid().defaultRandom().primaryKey(),
  name: text().notNull(),
  image: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const conversationsRelations = relations(conversation, ({ many }) => ({
  messages: many(message),
  members: many(usersToConversation),
}));
