import { sendMessage, createInvite, cache } from "../../../deps.ts";
import { bot } from "../../../cache.ts";
import { PermissionLevels } from "../.././types/commands.ts";
bot.commands.set("serverinvite", {
  name: "serverinvite",
  aliases: ["sinvite"],
  dmOnly: false,
  guildOnly: false,
  nsfw: false,
  permissionLevels: [PermissionLevels.BOT_OWNER],
  botServerPermissions: [],
  botChannelPermissions: ["SEND_MESSAGES"],
  userServerPermissions: [],
  userChannelPermissions: [],
  description: "Creates a server invite in a server that the bot has access to.",
  arguments: [
    {
      name: "guildid",
      type: "string",
    },
  ],
  execute: async function (message, args) {
    const guildid = args.guildid;
    const getguild = cache.guilds.get(guildid);
    if (!getguild) return sendMessage(message.channelId, "This guild ID isn't valid!");
    const chanid = getguild?.systemChannelId;
    if (!chanid) return sendMessage(message.channelId, "Unable to get the systems channelID from server.");
    const inv = await createInvite(chanid, {
      maxAge: 0,
      maxUses: 0,
      temporary: false,
      unique: true,
    });
    if (!inv) return sendMessage(message.channelId, "Error creating an Invite to this server");

    sendMessage(message.channelId, `https://discord.gg/${inv.code}`);
  },
});
