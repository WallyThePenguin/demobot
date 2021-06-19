import { sendMessage, cache } from "../../../deps.ts";
import { bot } from "../../../cache.ts";
import { PermissionLevels } from "../.././types/commands.ts";
bot.commands.set("guildlist", {
  name: "guildlist",
  aliases: ["gl"],
  dmOnly: false,
  guildOnly: false,
  nsfw: false,
  permissionLevels: [PermissionLevels.BOT_OWNER],
  botServerPermissions: [],
  botChannelPermissions: ["SEND_MESSAGES"],
  userServerPermissions: [],
  userChannelPermissions: [],
  description: "Lists the servers that your bot is in with server id.",
  execute: function (message) {
    const guildave = cache.guilds.map((g) => g.unavailable);
    const guildlist = cache.guilds.map((g) => g.id);
    sendMessage(message.channelId, `IDS: ${guildlist}, Availability: ${guildave}`);
  },
});
