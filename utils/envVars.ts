import { config } from "dotenv";

config();

export const variables = {
  DATABASE_URL: process.env.DATABASE_URL,
};
