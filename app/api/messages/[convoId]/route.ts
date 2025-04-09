import { CustomFileType } from "@/components/Chat";
import { db } from "@/db";
import { conversation, file, message } from "@/db/schemas";
import { eq, InferInsertModel, InferSelectModel } from "drizzle-orm";
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

  const messages = await db.query.message.findMany({
    columns: {
      attachment: false,
    },
    with: {
      file: true,
    },
    where: eq(message.conversationId, convoId),
  });
  return Response.json(messages);
};

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ convoId: string }> }
) => {
  const res = (await request.json()) as InferInsertModel<typeof message> &
    CustomFileType;
  const { convoId } = await params;

  if (!convoId) {
    return Response.json(
      { message: "Conversation ID not provided" },
      { status: 500 }
    );
  }

  let newFile: InferSelectModel<typeof file> | null = null;

  if (res.file) {
    newFile = (
      await db
        .insert(file)
        .values({
          name: res.file.name,
          type: res.file.type,
          size: res.file.size,
        })
        .returning()
    )[0];
  }

  const newMessage = (
    await db
      .insert(message)
      .values({ ...res, ...(newFile && { attachment: newFile.id }) })
      .returning()
  )[0];

  await db
    .update(conversation)
    .set({ updatedAt: newMessage.createdAt })
    .where(eq(conversation.id, newMessage.conversationId));

  return Response.json({ ...newMessage, file: newFile });
};
