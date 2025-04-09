import { CustomFileType } from "@/components/Chat";
import { db } from "@/db";
import { conversation, message } from "@/db/schemas";
import { auth } from "@/utils/auth";
import { desc, InferSelectModel } from "drizzle-orm";
import { headers } from "next/headers";

export interface CustomConvoUser {
  name: string;
  id: string;
  image: string;
  email: string;
}

export interface CustomConvoType {
  name: string;
  id: string;
  image: string;
  messages: (InferSelectModel<typeof message> & CustomFileType)[];
  updatedAt: Date;
  members: {
    conversationId: string;
    memberId: string;
    joinedAt: Date;
    user: CustomConvoUser;
  }[];
}

export const GET = async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 500 });

  const id = session.user.id;

  const allConversations = await db.query.conversation.findMany({
    orderBy: [desc(conversation.updatedAt)],
    columns: {
      name: true,
      image: true,
      id: true,
      updatedAt: true,
    },
    with: {
      messages: {
        orderBy: [desc(message.createdAt)],
        limit: 1,
        with: {
          file: true,
        },
      },
      members: {
        with: {
          user: {
            columns: {
              id: true,
              email: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });

  const filteredConversations = allConversations.filter((convo) =>
    convo.members.some(({ user }) => user?.id === id)
  );

  console.log(filteredConversations);

  return Response.json(filteredConversations);
};
