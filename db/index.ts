import { variables } from "@/utils/envVars";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@/db/schemas";

export const db = drizzle({
  connection: variables.DATABASE_URL as string,
  casing: "snake_case",
  schema,
});
