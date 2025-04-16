import { CustomFileType } from "@/components/Chat";
import { db } from "@/db";
import { conversation, message, usersToConversation } from "@/db/schemas";
import { auth } from "@/utils/auth";
import { desc, eq, InferSelectModel } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

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

interface CreateConversationType {
  userIds: string[];
  name: string;
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

  return Response.json(filteredConversations);
};

export const POST = async (request: NextRequest) => {
  const res = (await request.json()) as CreateConversationType;

  const newConvo = (
    await db.insert(conversation).values({ name: res.name }).returning()
  )[0];

  for (const id of res.userIds) {
    await db
      .insert(usersToConversation)
      .values({ memberId: id, conversationId: newConvo.id });
  }

  const convo = await db.query.conversation.findFirst({
    where: eq(conversation.id, newConvo.id),
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

  return Response.json(convo);
};
