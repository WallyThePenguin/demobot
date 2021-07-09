import { bot } from "../../cache.ts";
import { runQuery } from "../database/client.ts";
import { GuildSchema, UserSchema } from "../database/schemas.ts";

bot.monitors.set("messageCounter", {
  name: "messageCounter",
  ignoreBots: true,
  ignoreOthers: false,
  ignoreEdits: true,
  ignoreDM: true,
  async execute(message) {
    //Find if Guild the monitor fired in is in my db.
    const [guild] = await runQuery<GuildSchema>(`SELECT * FROM "GuildSchema" WHERE "guildId" = $1`, [message.guildId]);
    if (!guild) return;

    const [Usercheck] = await runQuery<UserSchema>(`SELECT * FROM "UserSchema" WHERE id = $1`, [message.authorId]);
    if (!Usercheck) {
      await runQuery<UserSchema>(
        `INSERT INTO "UserSchema" (id, messages) VALUES 
        ($1, 1)`,
        [message.authorId]
      );
      return;
    }
    if (Usercheck) {
      await runQuery<UserSchema>(`UPDATE "UserSchema" SET "messages" = "messages" + 1 WHERE "id"=$1`, [
        message.authorId,
      ]);
    }
  },
});
