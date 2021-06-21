import { bot } from "../../cache.ts";
import { bigintToSnowflake } from "../../deps.ts";
import { db } from "../database/database.ts";

bot.monitors.set("messageCounter", {
  name: "messageCounter",
  ignoreBots: true,
  ignoreOthers: false,
  ignoreEdits: true,
  ignoreDM: true,
  async execute(message) {
    //Find if Guild the monitor fired in is in my db.
    const guild = db.guilds.has(bigintToSnowflake(message.guildId));
    if (!guild) return;

    const Usercheck = await db.users.has(bigintToSnowflake(message.authorId));
    if (!Usercheck) {
      db.users.create(bigintToSnowflake(message.authorId), { id: bigintToSnowflake(message.authorId), messages: 1 });
      return undefined;
    }
    const User = await db.users.get(bigintToSnowflake(message.authorId));
    if (!User) return;
    if (User.messages)
      return await db.users.update(bigintToSnowflake(message.authorId), { messages: User.messages + 1 });
  },
});
