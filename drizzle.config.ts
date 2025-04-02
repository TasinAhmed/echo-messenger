import { defineConfig } from "drizzle-kit";
import { variables } from "./utils/envVars";

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schemas",
  out: "./db/migrations",
  dbCredentials: {
    url: variables.DATABASE_URL as string,
  },
  verbose: true,
  casing: "snake_case",
  strict: true,
});
