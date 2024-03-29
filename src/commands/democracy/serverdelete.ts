import { sendMessage, deleteGuild, snowflakeToBigint } from "../../../deps.ts";
import { createCommand } from "../../utils/helpers.ts";
import { PermissionLevels } from "../.././types/commands.ts";
createCommand({
  name: "serverdelete",
  aliases: ["sdel"],
  dmOnly: false,
  guildOnly: false,
  nsfw: false,
  permissionLevels: [PermissionLevels.BOT_OWNER],
  botServerPermissions: [],
  botChannelPermissions: ["SEND_MESSAGES"],
  userServerPermissions: [],
  userChannelPermissions: [],
  description: "Deletes Guilds that the bot is owner in. (WARNING: you can't get the server back!)",
  arguments: [
    {
      name: "serverid",
      type: "string",
    },
  ],
  execute: async function (message, args) {
    const servid = args.serverid;
    try {
      await deleteGuild(snowflakeToBigint(servid));
    } catch (_error) {
      return sendMessage(message.channelId, "Server ID doesn't exist/ Invalid Server ID");
    }
    return sendMessage(message.channelId, `Successfully deleted the server with the id of \`${servid}\``);
  },
});
