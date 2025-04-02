import { variables } from "@/utils/envVars";
import { drizzle } from "drizzle-orm/node-postgres";

export const db = drizzle({
  connection: variables.DATABASE_URL as string,
  casing: "snake_case",
});
