import { Embed } from "../../utils/Embed.ts";
import { Components } from "../../utils/components.ts";
import { needButton } from "../../utils/collectors.ts";
import { createCommand } from "../../utils/helpers.ts";
import { runQuery, gamedatacheck } from "../../database/client.ts";
import {
  sendInteractionResponse,
  snowflakeToBigint,
  DiscordInteractionResponseTypes,
  sendDirectMessage,
} from "../../../deps.ts";
import { GameUserSchema } from "../../database/schemas.ts";

createCommand({
  name: `gamestart`,
  aliases: [`gs`, `gstart`],
  description: `This is to start playing the game, it will give you a quick tutorial on how to play!`,
  guildOnly: false,
  execute: async (message) => {
    //**Check if they exist in the db, if they do have them use the !tutorial command. */
    const check = await gamedatacheck(message.authorId);
    if (check === true)
      return message.reply(
        `You already have been through the tutorial already! If you would like to go through it again, say \`!tutorial\``
      );
    //**Set the default stats here, will change later. */
    const defaultstats = `INSERT INTO "GameUserSchema" (id, money, health, basicattack, abilitypower, speed, luck, chance, critchance, critdmgmultiplier, defense, dm) VALUES ($1, 99999, 99999, 99999, 99999, 99999, 99999, 99999, 99999, 99999, 99999, $2)`;
    //**embed one will be the prompting an option */
    const embed1 = new Embed()
      .setAuthor(`${message.guild?.botMember?.nick || message.guild?.bot?.tag}`, message.guild?.bot?.avatarURL)
      .setColor("random")
      .addField(
        "Option:",
        `Before we start would you like to see messages about the game in DM's Or in Servers?(You can change this later!)`
      )
      .setTimestamp();
    //**Buttons for embed1 */
    const buttons1 = new Components()
      .addButton("DM's", "Success", "1")
      .addButton("Servers (Recommended)", "Danger", "2");
    //**Edit for embed1 if they choose dming. */
    const dmembed = new Embed()
      .setAuthor(`${message.guild?.botMember?.nick || message.guild?.bot?.tag}`, message.guild?.bot?.avatarURL)
      .setColor("random")
      .addField("Alright!", `Check your DM's for the rest of the tutorial!`)
      .setTimestamp();
    //**Tutorial Part one is embed2 */
    const embed2 = new Embed()
      .setAuthor(`${message.guild?.botMember?.nick || message.guild?.bot?.tag}`, message.guild?.bot?.avatarURL)
      .setColor("random")
      .addField("Tutorial P1", `Blah Blah Blah Blah Blah Blah Blah`)
      .setTimestamp();
    const buttons2 = new Components().addButton("Previous", "Primary", "1").addButton("Next", "Success", "2");
    //**Send embed1 */
    const message1 = await message.reply({ embeds: [embed1], components: buttons1 }, true);
    //**await buttonpress. */
    const buttonreply = await needButton(message.authorId, message1.id);
    switch (buttonreply.customId) {
      case "1":
        {
          await runQuery<GameUserSchema>(defaultstats, [message.authorId, true]);
          sendInteractionResponse(snowflakeToBigint(buttonreply.interaction.id), buttonreply.interaction.token, {
            type: DiscordInteractionResponseTypes.UpdateMessage,
            data: {
              embeds: [dmembed],
            },
          }).catch(console.warn);
          //Need const here to edit direct message
          await sendDirectMessage(message.authorId, { embeds: [embed2], components: buttons2 });
        }
        break;

      case "2":
        {
          runQuery<GameUserSchema>(defaultstats, [message.authorId, false]);
          //Need const here to edit again
          await sendInteractionResponse(snowflakeToBigint(buttonreply.interaction.id), buttonreply.interaction.token, {
            type: DiscordInteractionResponseTypes.UpdateMessage,
            data: {
              embeds: [embed2],
              components: buttons2,
            },
          }).catch(console.warn);
        }
        break;
    }
  },
});
