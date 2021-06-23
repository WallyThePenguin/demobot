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
    const guildlist = cache.guilds.map((g) => g.id);
    const guildname = cache.guilds.map((g) => g.name);
    message.reply(
      `${guildname[0]}, ${guildlist[0]} \n ${guildname[1]}, ${guildlist[1]}  \n  ${guildname[2]}, ${guildlist[2]}  \n  ${guildname[3]}, ${guildlist[3]}  \n  ${guildname[4]}, ${guildlist[4]}  \n  ${guildname[5]}, ${guildlist[5]}  \n  ${guildname[6]}, ${guildlist[6]}  \n  ${guildname[7]}, ${guildlist[7]}  \n  ${guildname[8]}, ${guildlist[8]}  \n  ${guildname[9]}, ${guildlist[9]} `
    );
  },
});
