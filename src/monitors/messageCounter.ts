import { bot } from "../../cache.ts";
import { sql } from "../database/client.ts";
import { GuildSchema, UserSchema } from "../database/schemas.ts";

bot.monitors.set("messageCounter", {
  name: "messageCounter",
  ignoreBots: true,
  ignoreOthers: false,
  ignoreEdits: true,
  ignoreDM: true,
  async execute(message) {
    //Find if Guild the monitor fired in is in my db.
    const [guild] = await sql<
      GuildSchema[]
    >`SELECT * FROM "GuildSchema" WHERE "guildId" = ${message.guildId.toString()}`;
    if (!guild) return;

    const [Usercheck] = await sql<UserSchema[]>`SELECT * FROM "UserSchema" WHERE id = ${message.authorId.toString()}`;
    if (!Usercheck) {
      await sql<UserSchema[]>`INSERT INTO "UserSchema" (id, messages) VALUES 
        (${message.authorId.toString()}, 1)`;
      return;
    }
    if (Usercheck) {
      await sql<
        UserSchema[]
      >`UPDATE "UserSchema" SET "messages" = "messages" + 1 WHERE "id"=${message.authorId.toString()}`;
    }
  },
});
