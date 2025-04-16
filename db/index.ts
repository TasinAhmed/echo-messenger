import { variables } from "@/utils/envVars";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schemas";

const client = postgres(variables.DATABASE_URL!, { prepare: false });
export const db = drizzle({
  client,
  casing: "snake_case",
  schema,
});
