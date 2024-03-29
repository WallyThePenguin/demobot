import { Embed } from "../../utils/Embed.ts";
import { createCommand } from "../../utils/helpers.ts";
import { sql, gamedatacheck, checklevel } from "../../database/client.ts";
import { GameUserSchema } from "../../database/schemas.ts";
createCommand({
  name: `profile`,
  aliases: [`prof`],
  description: `This is to view your stats, if you would like to view someone elses stats, follow the command with a mention`,
  guildOnly: false,
  arguments: [
    {
      name: "User",
      type: "member",
      required: false,
    },
  ],
  execute: async (message, args) => {
    //**Using args for User */
    const member = args.member || message.member;
    //**using datacheck function to see if they exist in the db */
    const check = await gamedatacheck(member.id);
    if (check === false)
      return message.reply(
        `${member.mention} Is not in the database, have them start playing the game by saying \`!gs\`!`
      );
    //**Get the stats of the user */
    const [stats] = await sql<
      GameUserSchema[]
    >`SELECT * FROM "GameUserSchema" WHERE id = ${member.id.toString()} LIMIT 1`;
    const level = await checklevel(member.id);
    //**Make an embed with the db stats and send. */
    const statembed = new Embed()
      .setAuthor(`${message.guild?.botMember?.nick || message.guild?.bot?.tag}`, message.guild?.bot?.avatarURL)
      .setColor("random")
      .setTitle(`Stats:`)
      .setDescription(
        `Here, You can view the current stats of ${member.mention} \n**Money:** ${stats.money} \n**Health:** ${stats.health} \n**Defense:** ${stats.defense} \n**Attack Damage:** ${stats.basicattack} \n**Ability Power:** ${stats.abilitypower} \n **Speed:** ${stats.speed} \n**Merchant Level:** ${stats.luck} \n**Chance:** ${stats.chance} \n **Critical Chance:** ${stats.critchance} \n **Critical Damage Multiplier:** ${stats.critdmgmultiplier} \n **XP amount:** ${level.xp} \n **Level:** ${level.level} \n **Stat points:** ${stats.statpoints} \n **Total points:** ${stats.totalpoints}`
      )
      .setTimestamp();
    message.reply({ embeds: [statembed] });
  },
});
