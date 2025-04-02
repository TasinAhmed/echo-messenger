import { db } from ".";

const main = async () => {
  try {
    await db.execute("DROP DATABASE echo;");
  } catch (error) {
    console.log(error);
  }
};

main();
