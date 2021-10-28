import { Embed } from "../../utils/Embed.ts";
import { createCommand } from "../../utils/helpers.ts";
import { givechest } from "../../database/client.ts";
import { PermissionLevels } from "../../types/commands.ts";
createCommand({
  name: `chestgive`,
  aliases: [`cg`],
  permissionLevels: [PermissionLevels.BOT_OWNER],
  description: `This is to give a chest, strictly to the owner for now. :)`,
  guildOnly: false,
  arguments: [
    { name: "user", type: "member", required: false },
    { name: "level", type: "number", required: false },
  ] as const,
  execute: async (message, args) => {
    const user = args.user?.id || message.authorId;
    const username = args.user?.username || message.member?.username;
    const level = args.level || 1;
    const chestGiven = await givechest(user, level);
    const embed = new Embed()
      .setTitle(`New Chest Given!`)
      .addField(`${username}`, `**Got Chest:** Level ${chestGiven.chestlevel}`)
      .addField(`Unique Chest ID:`, `${chestGiven.chestid}`);
    message.reply({ embeds: [embed] });
  },
});
