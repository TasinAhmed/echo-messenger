import { db } from "@/db";
import { user } from "@/db/schemas";

export const GET = async () => {
  const users = await db.select().from(user);

  return Response.json(users);
};
