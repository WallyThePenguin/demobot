import { cache } from "../../../deps.ts";
import { PermissionLevels } from "../.././types/commands.ts";
import { createCommand } from "../../utils/helpers.ts";
createCommand({
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
    const GuildArray = cache.guilds.map((g) => `${g.name}, ${g.memberCount} Members, ${g.id}`);
    message.send(GuildArray.join("\n"));
  },
});
