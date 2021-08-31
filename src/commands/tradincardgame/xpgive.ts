import { createCommand } from "../../utils/helpers.ts";
import { Embed } from "../../utils/Embed.ts";
import { xpchange, xpforlevel, checklevel } from "../../database/client.ts";
import { PermissionLevels } from "../../types/commands.ts";
createCommand({
  name: `leveledit`,
  aliases: [`levelchange`],
  permissionLevels: [PermissionLevels.BOT_OWNER],
  description: `Edit UserXP and give the user levels, Only for BotOwner.`,
  guildOnly: false,
  arguments: [
    {
      name: "user",
      type: "member",
      required: false,
    },
    {
      name: "level",
      type: "number",
    },
    {
      name: "give",
      type: "boolean",
      required: false,
    },
  ] as const,
  execute: async (message, args) => {
    //Getting user
    const user = args.user?.id || message.authorId;
    //Getting Userlevel
    const userlevel = await checklevel(user);
    //Getting the xp required for level
    const xprequirement = xpforlevel(args.level);
    //Doing the math, setting it to absolute value incase im removing levels from the user.
    const xpneeded = Math.abs(xprequirement.levelminimum - userlevel.xp);
    //Change the users xp
    const xp = await xpchange(user, xpneeded, args.give);
    //Send confirmation.
    const embed = new Embed()
      .setTitle(`Level Edited!`)
      .addField("User Affected:", `<@${user}>`)
      .addField("Given?", `${args.give}`)
      .addField("XP Amount", `${xp.xp}`)
      .addField("Level up?", `${xp.levelup}`)
      .addField("New Level:", `${xp.level}`)
      .setTimestamp();
    message.reply({ embeds: [embed] });
  },
});
