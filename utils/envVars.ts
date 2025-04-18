import { config } from "dotenv";

config({ path: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env' });

export const variables = {
  DATABASE_URL: process.env.DATABASE_URL,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL
};
