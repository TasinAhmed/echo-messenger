import { variables } from "@/utils/envVars";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@/db/schemas";

export const db = drizzle({
  connection: variables.DATABASE_URL!,
  casing: "snake_case",
  schema,
});
