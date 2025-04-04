import { db } from "@/db";
import { auth } from "@/utils/auth";
import { headers } from "next/headers";

export interface CustomConvoType {
  name: string;
  id: string;
  image: string;
  members: {
    conversationId: string | null;
    memberId: string | null;
    joinedAt: Date;
    user: {
      name: string;
      id: string;
      image: string | null;
      email: string;
    } | null;
  }[];
}

export const GET = async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 500 });

  const id = session.user.id;

  const allConversations = await db.query.conversation.findMany({
    columns: {
      name: true,
      image: true,
      id: true,
    },
    with: {
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
