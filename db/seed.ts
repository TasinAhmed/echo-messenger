import { faker } from "@faker-js/faker";
import { db } from ".";
import * as schema from "@/db/schemas";
import { authClient } from "@/utils/auth-client";

const main = async () => {
  try {
    await db.delete(schema.usersToConversation);
    await db.delete(schema.message);
    await db.delete(schema.conversation);
    await db.delete(schema.user);
    await db.delete(schema.account);
    await db.delete(schema.session);
    await db.delete(schema.verification);
    await db.delete(schema.file);

    const createUsers = [...Array(20).keys()].map(() => {
      const user = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: "tasin123",
        image: faker.image.avatar(),
      };

      return authClient.signUp
        .email({ ...user, fetchOptions: {} })
        .then(({ data }) => data?.user.id);
    });

    const users = await Promise.all(createUsers);

    for (const userId of users) {
      const userConversations = await db
        .insert(schema.conversation)
        .values(
          [...Array(10).keys()].map(() => ({
            name: faker.company.name(),
            image: faker.image.avatar(),
          }))
        )
        .returning();

      for (const conversation of userConversations) {
        let filteredUsers = users.filter((id) => id !== userId);
        const secondUser =
          filteredUsers[Math.floor(Math.random() * filteredUsers.length)];
        filteredUsers = filteredUsers.filter((id) => id !== secondUser);
        const thirdUser =
          filteredUsers[Math.floor(Math.random() * filteredUsers.length)];

        await db.insert(schema.usersToConversation).values([
          {
            conversationId: conversation.id,
            memberId: userId!,
          },
          {
            conversationId: conversation.id,
            memberId: secondUser!,
          },
          {
            conversationId: conversation.id,
            memberId: thirdUser!,
          },
        ]);
      }
    }
  } catch (error) {
    console.log(error);
  }
};

main();
