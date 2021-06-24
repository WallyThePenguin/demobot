import { sendMessage, cache } from "../../../deps.ts";
import { bot } from "../../../cache.ts";
import { PermissionLevels } from "../.././types/commands.ts";
import { Embed } from "../../utils/Embed.ts";

bot.commands.set("serveridentify", {
  name: "serveridentify",
  aliases: ["si"],
  dmOnly: false,
  guildOnly: false,
  nsfw: false,
  permissionLevels: [PermissionLevels.BOT_OWNER],
  botServerPermissions: [],
  botChannelPermissions: ["SEND_MESSAGES"],
  userServerPermissions: [],
  userChannelPermissions: [],
  description: "If you have the server's ID, you can identify it with this command",
  arguments: [
    {
      name: "ServerID",
      type: "string",
    },
  ],
  execute: function (message, args) {
    const guild = args.ServerID;
    const guildbase = cache.guilds.get(guild);
    const info = {
      name: guildbase?.name,
      owner: guildbase?.ownerId,
      membersamount: guildbase?.memberCount,
      channelamount: guildbase?.channels.size,
    };
    if (!guildbase) return sendMessage(message.channelId, "Error getting info on guild.");
    const embed = new Embed()
      .setColor("#fcba03")
      .setTitle(`Server Identified:`)
      .addField("Name/ID:", `${info.name}/\`${args.ServerID}\``)
      .addField("Created By:", `<@${info.owner}>`)
      .addField("Number of Members", `${info.membersamount}`)
      .addField("Number of Channels", `${info.channelamount}`)
      .setTimestamp();

    sendMessage(message.channelId, { embed });
  },
});
