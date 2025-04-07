import { db } from "@/db";
import { conversation, message } from "@/db/schemas";
import { eq, InferInsertModel } from "drizzle-orm";
import { NextRequest } from "next/server";

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ convoId: string }> }
) => {
  const { convoId } = await params;

  if (!convoId) {
    return Response.json(
      { message: "Conversation ID not provided" },
      { status: 500 }
    );
  }

  const messages = await db
    .select()
    .from(message)
    .where(eq(message.conversationId, convoId));
  return Response.json(messages);
};

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ convoId: string }> }
) => {
  const res = (await request.json()) as InferInsertModel<typeof message>;
  const { convoId } = await params;

  if (!convoId) {
    return Response.json(
      { message: "Conversation ID not provided" },
      { status: 500 }
    );
  }

  const newMessage = (await db.insert(message).values(res).returning())[0];
  await db
    .update(conversation)
    .set({ updatedAt: newMessage.createdAt })
    .where(eq(conversation.id, newMessage.conversationId));

  return Response.json(newMessage);
};
