import { sendMessage, editBotStatus, DiscordActivityTypes } from "../../../deps.ts";
import { createCommand } from "../../utils/helpers.ts";
import { PermissionLevels } from "../.././types/commands.ts";
createCommand({
  name: "newbotstatus",
  aliases: ["nbs"],
  dmOnly: false,
  guildOnly: false,
  nsfw: false,
  permissionLevels: [PermissionLevels.BOT_OWNER],
  botServerPermissions: [],
  botChannelPermissions: ["SEND_MESSAGES"],
  userServerPermissions: [],
  userChannelPermissions: [],
  description: "Allows you to make a new bot status.",
  arguments: [
    {
      name: "Newstatus",
      type: "...strings",
      defaultValue: "Being Democratic...",
    },
  ],
  //deno-lint-ignore require-await
  execute: async function (message, args) {
    const nsv = args.Newstatus;
    editBotStatus({
      status: "dnd",
      activities: [
        {
          name: `${nsv}`,
          type: DiscordActivityTypes.Game,
          createdAt: Date.now(),
        },
      ],
    });
    sendMessage(message.channelId, "Successfully changed the bot status to  " + ` ${nsv}`);
  },
});
