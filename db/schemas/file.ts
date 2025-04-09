import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";

export const file = pgTable("file", {
  id: uuid().defaultRandom().primaryKey(),
  type: text().notNull(),
  name: text().notNull(),
  size: integer().notNull(),
});
